# AI-Powered Note-Taking Application

This project is an AI-powered note-taking application that combines a React frontend with a Django backend, Qdrant vector database, and Ollama LLM service.

## Features

- Create, edit, and delete notes
- Semantic search across your notes
- AI-generated suggestions for your notes
- Ask questions about your knowledge base

## Architecture

The application consists of the following components:

1. **Frontend**: React-based user interface
2. **API Gateway**: Django REST Framework backend
3. **Vector Database**: Qdrant for storing and querying vector embeddings
4. **LLM Service**: Ollama running llama3.2:1b for AI features

## Prerequisites

- Docker and Docker Compose
- At least 4GB of RAM available for Docker

## Getting Started

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - API: http://localhost:8000
   - Qdrant UI: http://localhost:6334

## Usage

### Creating Notes

1. Click the "New Note" button in the header
2. Enter a title and content for your note
3. Click "Save" to store the note

### Searching Notes

1. Use the search bar in the header to search your notes
2. The search uses semantic meaning rather than just keywords

### Getting AI Suggestions

1. When editing a note, type enough content (at least 50 characters)
2. AI-generated suggestions will appear below the editor
3. Click on a suggestion to add it to your note

### Asking Questions

1. Use the sidebar's "Ask about your notes" section
2. Type your question and press Enter or click "Ask"
3. The AI will search your notes and provide an answer based on your knowledge base

## Development

### Project Structure

```
.
├── api-gateway/            # Django backend
│   ├── app/                # Django project
│   │   ├── ai/             # AI features app
│   │   ├── notes/          # Notes management app
│   │   └── ...             # Django configuration
│   ├── Dockerfile          # Backend Dockerfile
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # React components and logic
│   ├── Dockerfile          # Frontend Dockerfile
│   └── package.json        # Node.js dependencies
└── docker-compose.yml      # Docker Compose configuration
```

### Customisation

- **Change the LLM model**: Edit the `OLLAMA_MODEL` environment variable in `docker-compose.yml`
- **Adjust vector dimensions**: Modify the `EMBEDDING_SIZE` constant in `api-gateway/app/notes/views.py`
- **Customize the UI**: Edit the React components in `frontend/src/components/`

## Troubleshooting

- **Frontend can't connect to backend**: Check that the API Gateway service is running and the nginx configuration is correct
- **Vector search not working**: Ensure Qdrant is running and the collection has been created
- **LLM features not working**: Verify that Ollama has successfully pulled the model and is running

## Stopping and Cleaning Up

### Using Docker Compose

To stop the application while preserving data:

```bash
docker-compose down
```

### Complete Teardown

For a complete cleanup (removing containers, volumes, networks, and images):

1. Stop and remove containers and volumes:
   ```bash
   docker-compose down -v
   ```

2. Remove networks:
   ```bash
   docker network prune -f
   ```

3. Remove project images:
   ```bash
   docker rmi opea-comps-api-gateway opea-comps-frontend
   ```

4. Remove dangling images:
   ```bash
   docker image prune -f
   ```

### Using Colima (macOS)

If you're using Colima on macOS:

1. Start Colima with custom resources:
   ```bash
   colima start --cpu 4 --memory 8 --disk 20
   ```

2. Stop Colima when not using the application:
   ```bash
   colima stop
   ```

3. Check Colima status:
   ```bash
   colima status
   ```

### Starting Fresh

To restart the application after a complete teardown:

1. If using Colima on macOS, start it first:
   ```bash
   colima start --cpu 4 --memory 8 --disk 20
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```
