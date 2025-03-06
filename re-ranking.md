# Re-Ranking in Retrieval-Augmented Generation (RAG) Systems

## The Importance of Re-Ranking

Re-ranking is a critical step in advanced RAG systems that can significantly improve the quality of retrieved context and, consequently, the quality of LLM responses. While a basic RAG implementation can work without it, adding a re-ranking step is a valuable enhancement as systems scale or when more precise retrieval is needed.

### Current Implementation in Our Project

Our current RAG implementation uses a simple retrieval approach:

1. **Embedding-based Retrieval**: The system uses the `all-MiniLM-L6-v2` model to generate 384-dimensional embeddings for both notes and queries.

2. **Vector Similarity Search**: When a user asks a question, the system:
   - Encodes the question into a vector embedding
   - Searches the Qdrant vector database for the most similar note embeddings using cosine similarity
   - Retrieves the top 5 most similar notes
   - Passes these notes as context to the LLM (Llama3.2:1b) to generate an answer

3. **No Re-ranking**: The current implementation doesn't include a re-ranking step after the initial retrieval.

### Why Re-ranking Is Important

Re-ranking can significantly improve the quality of RAG systems for several reasons:

1. **Different Similarity Metrics**: 
   - Initial retrieval (using bi-encoders like our SentenceTransformer) is optimized for speed but may miss nuanced relevance
   - Re-ranking can use more sophisticated models that better understand query-document relevance

2. **Addressing Limitations of Vector Search**:
   - Vector similarity is a good first filter but can miss semantic nuances
   - Similar vectors don't always mean the content is relevant to the specific question

3. **Improved Context Quality**:
   - Better context = better LLM responses
   - Re-ranking helps ensure the most relevant information is prioritized in the limited context window

4. **Handling Edge Cases**:
   - Re-ranking can help with queries that have multiple interpretations
   - It can better handle queries with specific requirements that vector similarity might miss

## Bi-Encoders vs Cross-Encoders

Understanding the difference between bi-encoders and cross-encoders is essential for implementing effective re-ranking.

### Bi-Encoders

Bi-encoders process query and document texts independently through the same encoder network:

1. **Architecture**:
   - Two separate encoding paths (same model) for query and document
   - Each text is encoded into a fixed-length vector embedding
   - Similarity is computed using vector operations (cosine similarity, dot product, etc.)

2. **How They Work in Our Project**:
   - Our project uses `SentenceTransformer('all-MiniLM-L6-v2')` as a bi-encoder
   - It encodes notes into 384-dimensional vectors and stores them in Qdrant
   - When a query comes in, it encodes the query and finds similar vectors

3. **Advantages**:
   - **Efficiency**: Once documents are encoded, you only need to encode the query
   - **Scalability**: Can handle large document collections (millions of documents)
   - **Fast retrieval**: Vector similarity can be computed quickly, especially with vector databases like Qdrant
   - **Pre-computation**: Document embeddings can be computed offline and stored

4. **Limitations**:
   - **Less precise**: Cannot capture complex interactions between query and document
   - **Independent encoding**: Query and document don't "see" each other during encoding

### Cross-Encoders

Cross-encoders process the query and document together as a single input:

1. **Architecture**:
   - Single encoding path that takes both query and document concatenated together
   - Outputs a single relevance score directly
   - No separate vector representations are created

2. **How They Would Work in Our Project**:
   - We would first retrieve candidate documents using our bi-encoder
   - Then pass each (query, document) pair through a cross-encoder like `CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')`
   - Re-rank based on the relevance scores

3. **Advantages**:
   - **Higher accuracy**: Can model complex interactions between query and document
   - **Direct relevance scoring**: Optimized specifically for relevance prediction
   - **Better understanding**: Can capture nuanced relationships that bi-encoders miss

4. **Limitations**:
   - **Computational cost**: Must process each (query, document) pair separately
   - **No pre-computation**: Cannot pre-compute document representations
   - **Limited scalability**: Impractical for initial retrieval from large collections

### Visual Comparison

```
Bi-Encoder:
                  ┌─────────────┐
Query ────────────► Encoder     ├─────► Query Vector ──┐
                  └─────────────┘                      │
                                                       ▼
                  ┌─────────────┐                 ┌────────────┐
Document ─────────► Encoder     ├─► Doc Vector ───► Similarity ├─► Score
                  └─────────────┘                 └────────────┘

Cross-Encoder:
                  ┌─────────────────────────┐
Query + Document ─► Encoder (joint encoding) ├─────────────────► Score
                  └─────────────────────────┘
```

## Implementation Options for Re-ranking

If we wanted to add re-ranking to our system, here are some approaches:

### 1. Cross-Encoder Models

```python
from sentence_transformers import CrossEncoder

candidates = qdrant_client.search(
    collection_name=settings.QDRANT_COLLECTION,
    query_vector=query_embedding.tolist(),
    limit=20 
)

cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

pairs = [[question, result.payload['content']] for result in candidates]

# Get relevance scores
scores = cross_encoder.predict(pairs)

# Sort by new scores and take top 5
reranked_results = [
    (candidates[i], scores[i]) 
    for i in range(len(candidates))
]
reranked_results.sort(key=lambda x: x[1], reverse=True)
top_results = reranked_results[:5]
```

#### Cross-Encoder Scoring System

The cross-encoder model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) produces relevance scores with the following characteristics:

- **Score Range**: Unbounded, typically ranging from large negative values (e.g., -10) to large positive values (e.g., +5)
- **Interpretation**:
  - **Higher positive scores** (e.g., +3.4782): Strong relevance
  - **Scores near zero**: Neutral relevance
  - **Negative scores** (e.g., -10.7062): Low relevance
- **Sorting**: Results are sorted by score in descending order (highest scores first)

Unlike a fixed 1-10 scale, these scores are relative and optimized for ranking rather than absolute measurement. The absolute values matter less than their relative ordering.

#### Source Information

The cross-encoder model `cross-encoder/ms-marco-MiniLM-L-6-v2` is fine-tuned specifically for relevance ranking tasks. It was trained on the MS MARCO dataset, which contains query-passage pairs with relevance judgments.

Source: [SentenceTransformers Cross-Encoders Documentation](https://www.sbert.net/examples/applications/cross-encoder/README.html)

Additional technical details:
- Base model: MiniLM-L-6
- Training dataset: MS MARCO passage ranking dataset
- Task: Passage re-ranking for information retrieval
- Output: Unbounded relevance score (higher = more relevant)

#### Unbounded Scoring System - Technical Details

According to the official SentenceTransformers documentation:


For the specific model we're using (`cross-encoder/ms-marco-MiniLM-L-6-v2`), the scores are not normalized to a fixed range like 0-1 or -1 to 1. Instead, they can be any real number, with:

- Larger positive values indicating higher relevance
- Values near zero indicating neutral relevance
- Negative values indicating low relevance or irrelevance

This is because the model was fine-tuned on the MS MARCO dataset using a pairwise ranking loss function, which optimizes for relative ordering rather than producing scores in a specific range.

From the [SentenceTransformers Cross-Encoder Models page](https://www.sbert.net/docs/pretrained_cross-encoders.html):


In practice, this means that when comparing scores between different query-document pairs, only the relative ordering matters, not the absolute values.

### 2. LLM-based Re-ranking

```python
reranked_results = []

for result in candidates:
    prompt = f"""
    Rate the relevance of the following text to the question on a scale of 1-10.
    
    Question: {question}
    
    Text: {result.payload['content']}
    
    Relevance score (1-10):
    """
    
    response = requests.post(
        f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/generate",
        json={"model": settings.OLLAMA_MODEL, "prompt": prompt}
    )
    
    # Extract score from response
    score = extract_score_from_response(response.json()['response'])
    reranked_results.append((result, score))

# Sort by score
reranked_results.sort(key=lambda x: x[1], reverse=True)
top_results = reranked_results[:5]
```

### 3. Hybrid Search

Combine vector search with keyword search (BM25). Qdrant supports hybrid search which could be implemented without major changes to our architecture.

## Practical Differences in Implementation

### Encoding Process

- Bi-encoder (our current implementation):
  ```python
  query_embedding = model.encode(query)
  
  results = qdrant_client.search(
      collection_name=settings.QDRANT_COLLECTION,
      query_vector=query_embedding.tolist(),
      limit=5
  )
  ```

- Cross-encoder (potential implementation):
  ```python
  candidates = qdrant_client.search(
      collection_name=settings.QDRANT_COLLECTION,
      query_vector=query_embedding.tolist(),
      limit=20
  )
  
  cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
  pairs = [[query, candidate.payload['content']] for candidate in candidates]
  scores = cross_encoder.predict(pairs)
  
  # Sort by cross-encoder scores
  reranked_results = [(candidates[i], scores[i]) for i in range(len(candidates))]
  reranked_results.sort(key=lambda x: x[1], reverse=True)
  ```

### Performance Characteristics

- Bi-encoder: O(1) for encoding query + O(log n) for retrieval
- Cross-encoder: O(k) where k is the number of candidate documents to re-rank

## Typical Use Cases in RAG Systems

In modern RAG systems, the best practice is to combine both approaches:

1. **Two-Stage Retrieval**:
   - **Stage 1**: Use bi-encoders for efficient initial retrieval from large collections
   - **Stage 2**: Use cross-encoders to re-rank the top candidates for higher precision

2. **Our Current System**:
   - Stage 2 (cross-encoder re-ranking) improve the quality of context provided to our LLM

### Example in the application
```sh
curl -X POST "http://localhost:8000/api/ai/search/" -H "Content-Type: application/json" -d '{"query": "ramen", "limit": 5}'
```
returns 
```sh
{"results":[{"id":"8979023f-bf29-4057-96f7-d4867f2ae2fd","title":"Having ramen on Fridays","content":"Having Ramen
 on Fridays with Highball is the best","created_at":"","updated_at":""},{"id":"f2929f32-81be-463c-b291-e110ad60e41
9","title":"what to cook for dinner","content":"ayakadon","created_at":"","updated_at":""}]}%
```
Checking the log file to see re-ranking from logger statement printed.
```sh
docker-compose exec api-gateway cat /app/data/search_debug.log | tail -n 10
```
returns
```sh
2025-03-06 00:05:32,962 - httpx - INFO - HTTP Request: POST http://qdrant:6333/collections/notes/points/search "HT
TP/1.1 200 OK"
2025-03-06 00:05:32,963 - ai_views - INFO - Found 2 initial results using bi-encoder for query: 'dinner recipe'
2025-03-06 00:05:32,963 - ai_views - INFO - Using cross-encoder model: cross-encoder/ms-marco-MiniLM-L-6-v2 for re
-ranking
2025-03-06 00:05:32,970 - ai_views - INFO - Re-ranked result 1: Score=-10.1012, Title=what to cook for dinner
2025-03-06 00:05:32,970 - ai_views - INFO - Re-ranked result 2: Score=-10.4736, Title=Having ramen on Fridays
2025-03-06 00:05:57,673 - httpx - INFO - HTTP Request: POST http://qdrant:6333/collections/notes/points/search "HT
TP/1.1 200 OK"
2025-03-06 00:05:57,673 - ai_views - INFO - Found 2 initial results using bi-encoder for query: 'ramen'
2025-03-06 00:05:57,673 - ai_views - INFO - Using cross-encoder model: cross-encoder/ms-marco-MiniLM-L-6-v2 for re
-ranking
2025-03-06 00:05:57,681 - ai_views - INFO - Re-ranked result 1: Score=3.4782, Title=Having ramen on Fridays
2025-03-06 00:05:57,681 - ai_views - INFO - Re-ranked result 2: Score=-10.7062, Title=what to cook for dinner
```

1. For the query "dinner recipe":
- The re-ranked results show that "what to cook for dinner" (Score=-10.1012) is ranked higher than "Having ramen on Fridays" (Score=-10.4736)
- This makes sense as "what to cook for dinner" is more directly related to dinner recipes
2. For the query "ramen":
- The re-ranked results show that "Having ramen on Fridays" (Score=3.4782) is ranked significantly higher than "what to cook for dinner" (Score=-10.7062)
- This is a much more dramatic difference in scores, showing that the cross-encoder correctly identified that the first document is much more relevant to the query about ramen
The cross-encoder is clearly working as expected, providing more accurate relevance scoring than the initial bi-encoder retrieval would on its own. The positive score for the ramen query matching with the ramen document shows a strong relevance, while the negative scores indicate less relevance.

## Implemented Question-Answering Flow with Cross-Encoder Re-Ranking

Below is a detailed flow chart of how our question-answering functionality works with cross-encoder re-ranking:

### Detailed Process Explanation

1. **Frontend Request**: 
   - The frontend sends a POST request to `/api/ai/ask/` with a JSON payload containing the user's question
   - Example: `{"question": "What should I cook for dinner?"}`

2. **Question Encoding**:
   - The API Gateway receives the request and extracts the question
   - The question is encoded into a vector embedding using the SentenceTransformer bi-encoder model
   - Model used: `all-MiniLM-L6-v2` (384-dimensional embeddings)

3. **Initial Vector Search**:
   - The question vector is sent to Qdrant for similarity search
   - Qdrant finds notes with vector embeddings similar to the question vector
   - The search retrieves more candidates (20) than needed for the final results to provide a better pool for re-ranking

4. **Candidate Retrieval**:
   - Qdrant returns the top 20 most similar notes based on vector similarity
   - Each note includes its ID, title, content, and other metadata

5. **Cross-Encoder Re-Ranking**:
   - The API Gateway prepares pairs of [question, note] for each retrieved note
   - These pairs are passed through the cross-encoder model
   - Model used: `cross-encoder/ms-marco-MiniLM-L-6-v2`

6. **Score Calculation and Sorting**:
   - The cross-encoder assigns a relevance score to each note
   - Notes are sorted by their relevance scores in descending order
   - The top 5 notes are selected as the most relevant context

7. **Context Extraction**:
   - The content from the top 5 re-ranked notes is extracted
   - This content is formatted into a context string that will be sent to the LLM

8. **LLM Query Preparation**:
   - The API Gateway prepares a prompt that includes:
     - The original user question
     - The context extracted from the relevant notes
   - This prompt is sent to the Ollama LLM service

9. **Answer Generation**:
   - The LLM (Llama3.2:1b) generates an answer based on the provided context
   - The answer is tailored to address the user's question using the information in the notes

10. **Response to Frontend**:
    - The API Gateway formats the LLM's answer into a JSON response
    - Example: `{"answer": "Based on your notes, you could cook ayakadon for dinner. Alternatively, if it's Friday, you might want to stick with your tradition of having ramen with a highball."}`

11. **Frontend Display**:
    - The frontend receives the response and displays the answer to the user

### Real-World Example

For a question like "What should I eat tonight?", the process would look like:

1. The question is encoded into a vector
2. Qdrant finds notes related to food
3. The cross-encoder re-ranks these notes, prioritizing those most relevant to dinner options
4. The top notes might include "what to cook for dinner" and "Having ramen on Fridays"
5. The context from these notes is sent to the LLM
6. The LLM generates an answer like: "Based on your notes, you could have ayakadon for dinner. Alternatively, if it's Friday, you might want to stick with your tradition of having ramen with a highball."

This demonstrates how the cross-encoder improves the quality of context provided to the LLM, resulting in more accurate and relevant answers to the user's questions.

## Conclusion

The trade-off in re-ranking is between:
- **Speed**: No re-ranking is faster
- **Quality**: Re-ranking improves relevance
- **Resources**: Re-ranking requires additional computation

For a production system where answer quality is critical, implementing re-ranking is recommended. For a proof-of-concept or lightweight application, the current approach may be sufficient.

As our note-taking application grows and if we need higher precision in retrieval, adding a cross-encoder re-ranking step would be a valuable enhancement to improve the quality of AI-generated responses. 