from django.urls import path
from .views import SuggestionsView, AskView, SearchView

urlpatterns = [
    path('suggestions/', SuggestionsView.as_view(), name='suggestions'),
    path('ask/', AskView.as_view(), name='ask'),
    path('search/', SearchView.as_view(), name='search'),
] 