from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import json
import logging
from sentence_transformers import SentenceTransformer, CrossEncoder
from qdrant_client import QdrantClient
from qdrant_client.http import models

# for logging to debug when deployed
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/data/search_debug.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('ai_views')

# TODO should not hard code this.
model = SentenceTransformer('all-MiniLM-L6-v2')

cross_encoder = CrossEncoder(settings.CROSS_ENCODER_MODEL)

qdrant_client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

class SuggestionsView(APIView):
    def post(self, request):
        content = request.data.get('content', '')
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Call Ollama API from another container
        try:
            ollama_url = f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/generate"
            prompt = f"""
            Based on the following note content, suggest 3 relevant points or ideas that could be added to expand on this topic.
            Format your response as a JSON array of strings, each containing a single suggestion.
            
            Note content:
            {content}
            
            Suggestions:
            """
            
            response = requests.post(
                ollama_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                return Response(
                    {"error": "Failed to generate suggestions"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            ollama_response = response.json()
            generated_text = ollama_response.get('response', '')
            
            # extract JSON array from the response and parse into array 
            try:
                # manually identify first [ and last ] in the response
                start = generated_text.find('[')
                end = generated_text.rfind(']') + 1
                
                if start != -1 and end != -1:
                    json_str = generated_text[start:end]
                    suggestions = json.loads(json_str)
                else:
                    # split by newlines if more than 1
                    suggestions = [
                        line.strip().strip('-').strip() 
                        for line in generated_text.split('\n') 
                        if line.strip() and not line.strip().startswith('[') and not line.strip().endswith(']')
                    ]
            except json.JSONDecodeError:
                suggestions = [
                    line.strip().strip('-').strip() 
                    for line in generated_text.split('\n') 
                    if line.strip() and not line.strip().startswith('[') and not line.strip().endswith(']')
                ]
            
            # Ensure we have at most 3 suggestions
            # TODO should not hard code this
            suggestions = suggestions[:3]
            
            return Response({"suggestions": suggestions})
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate suggestions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AskView(APIView):
    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            question_embedding = model.encode(question)
            
            # retrieve 20 candidates for re-ranking
            search_results = qdrant_client.search(
                collection_name=settings.QDRANT_COLLECTION,
                query_vector=question_embedding.tolist(),
                # TODO should not hard code this
                limit=20 
            )
            
            if search_results:
                pairs = [[question, result.payload.get('content', '')] for result in search_results]
                scores = cross_encoder.predict(pairs)
                scored_results = list(zip(search_results, scores))
                scored_results.sort(key=lambda x: x[1], reverse=True)
                search_results = [item[0] for item in scored_results[:5]]
            context = ""
            for i, result in enumerate(search_results):
                context += f"Note {i+1}: {result.payload['title']}\n{result.payload['content']}\n\n"
            
            # error out
            if not context:
                return Response({"answer": "I don't have enough information to answer that question. Try adding some notes first."})
            
            # Call Ollama API from another container
            ollama_url = f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/generate"
            prompt = f"""
            Answer the following question based on the provided context from the user's notes.
            If the answer cannot be determined from the context, say so.
            
            Context:
            {context}
            
            Question:
            {question}
            
            Answer:
            """
            
            response = requests.post(
                ollama_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                return Response(
                    {"error": "Failed to generate answer"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            ollama_response = response.json()
            answer = ollama_response.get('response', '')
            
            return Response({"answer": answer})
            
        except Exception as e:
            return Response(
                {"error": f"Failed to answer question: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SearchView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        limit = request.data.get('limit', 5)
        
        if not query:
            return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            query_embedding = model.encode(query)
            
            search_results = qdrant_client.search(
                collection_name=settings.QDRANT_COLLECTION,
                query_vector=query_embedding.tolist(),
                limit=20  
            )
            
            logger.info(f"Found {len(search_results)} initial results using bi-encoder for query: '{query}'")
            
            # Re-rank the search results using cross-encoder
            if search_results:
                pairs = [[query, result.payload.get('content', '')] for result in search_results]
                
                # get relevance scores
                logger.info(f"Using cross-encoder model: {settings.CROSS_ENCODER_MODEL} for re-ranking")
                scores = cross_encoder.predict(pairs)
                
                scored_results = list(zip(search_results, scores))
                scored_results.sort(key=lambda x: x[1], reverse=True)
                
                for i, (result, score) in enumerate(scored_results[:limit]):
                    logger.info(f"Re-ranked result {i+1}: Score={score:.4f}, Title={result.payload.get('title', '')}")
                
                search_results = [item[0] for item in scored_results[:limit]]
            
            # format the results
            formatted_results = []
            for result in search_results:
                formatted_results.append({
                    'id': result.id,
                    'title': result.payload.get('title', ''),
                    'content': result.payload.get('content', ''),
                    'created_at': result.payload.get('created_at', ''),
                    'updated_at': result.payload.get('updated_at', '')
                })
            
            return Response({"results": formatted_results})
            
        except Exception as e:
            logger.error(f"Error in search: {str(e)}")
            return Response(
                {"error": f"Failed to search notes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 