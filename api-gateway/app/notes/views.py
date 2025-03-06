from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Note
from .serializers import NoteSerializer
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models
import uuid

# Initialize the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')
EMBEDDING_SIZE = 384  # The dimension of our vector embeddings

# Connect to Qdrant
qdrant_client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

# Ensure collection exists
def ensure_collection_exists():
    collections = qdrant_client.get_collections().collections
    collection_exists = any(collection.name == settings.QDRANT_COLLECTION for collection in collections)
    
    if not collection_exists:
        qdrant_client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=models.VectorParams(
                size=EMBEDDING_SIZE,
                distance=models.Distance.COSINE
            )
        )

# Call this function when the app starts
ensure_collection_exists()

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the note in the database
        note = serializer.save()
        
        # Generate embedding for the note content
        embedding = model.encode(note.content)
        
        # Generate a UUID for the vector
        vector_id = uuid.uuid4()
        
        # Store the embedding in Qdrant
        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=[
                models.PointStruct(
                    id=str(vector_id),
                    vector=embedding.tolist(),
                    payload={
                        "note_id": note.id,
                        "title": note.title,
                        "content": note.content
                    }
                )
            ]
        )
        
        # Update the note with the vector ID
        note.vector_id = vector_id
        note.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update the note in the database
        note = serializer.save()
        
        # Generate new embedding for the updated content
        embedding = model.encode(note.content)
        
        # If the note already has a vector ID, update it; otherwise, create a new one
        if note.vector_id:
            vector_id = note.vector_id
        else:
            vector_id = uuid.uuid4()
            note.vector_id = vector_id
            note.save()
        
        # Update the embedding in Qdrant
        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=[
                models.PointStruct(
                    id=str(vector_id),
                    vector=embedding.tolist(),
                    payload={
                        "note_id": note.id,
                        "title": note.title,
                        "content": note.content
                    }
                )
            ]
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # If the note has a vector ID, delete it from Qdrant
        if instance.vector_id:
            qdrant_client.delete(
                collection_name=settings.QDRANT_COLLECTION,
                points_selector=models.PointIdsList(
                    points=[str(instance.vector_id)]
                )
            )
        
        # Delete the note from the database
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Query parameter 'q' is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate embedding for the search query
        query_embedding = model.encode(query)
        
        # Search for similar notes in Qdrant
        search_results = qdrant_client.search(
            collection_name=settings.QDRANT_COLLECTION,
            query_vector=query_embedding.tolist(),
            limit=10
        )
        
        # Extract note IDs from search results
        note_ids = [int(result.payload['note_id']) for result in search_results]
        
        # Get the notes from the database
        notes = Note.objects.filter(id__in=note_ids)
        
        # Create a dictionary to map note IDs to their search scores
        scores = {result.payload['note_id']: result.score for result in search_results}
        
        # Serialize the notes
        serializer = self.get_serializer(notes, many=True)
        
        # Add the search scores to the serialized data
        results = []
        for item in serializer.data:
            item_with_score = dict(item)
            item_with_score['score'] = scores.get(str(item['id']), 0)
            results.append(item_with_score)
        
        # Sort the results by score (highest first)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return Response(results) 