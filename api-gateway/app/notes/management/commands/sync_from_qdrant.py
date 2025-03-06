from django.core.management.base import BaseCommand
from django.conf import settings
from app.notes.models import Note
from qdrant_client import QdrantClient
import uuid

class Command(BaseCommand):
    help = 'Synchronize notes from Qdrant to Django database'

    def handle(self, *args, **options):
        # Connect to Qdrant
        qdrant_client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        
        # Check if collection exists
        collections = qdrant_client.get_collections().collections
        collection_exists = any(collection.name == settings.QDRANT_COLLECTION for collection in collections)
        
        if not collection_exists:
            self.stdout.write(self.style.WARNING(f"Collection '{settings.QDRANT_COLLECTION}' does not exist in Qdrant"))
            return
        
        # Get all points from Qdrant
        points = qdrant_client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            limit=1000  # Adjust as needed
        )[0]  # The first element is the list of points
        
        self.stdout.write(f"Found {len(points)} points in Qdrant")
        
        # Get existing notes in Django
        existing_notes = {str(note.vector_id): note for note in Note.objects.all()}
        self.stdout.write(f"Found {len(existing_notes)} existing notes in Django")
        
        # Synchronize notes
        created_count = 0
        for point in points:
            vector_id = point.id
            payload = point.payload
            
            # Skip if note already exists in Django
            if vector_id in existing_notes:
                continue
            
            # Create note in Django
            note = Note(
                title=payload.get('title', 'Untitled'),
                content=payload.get('content', ''),
                vector_id=uuid.UUID(vector_id)
            )
            
            # Set note_id if available
            if 'note_id' in payload:
                note.id = payload['note_id']
            
            note.save()
            created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f"Successfully synchronized {created_count} notes from Qdrant to Django")) 