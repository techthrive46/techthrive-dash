from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Doc
from .serializers import DocListSerializer, DocSerializer


class DocViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Doc.objects.filter(user=self.request.user)
        query = self.request.query_params.get("q", "").strip()
        if query and self.action == "list":
            qs = qs.filter(Q(title__icontains=query) | Q(content_text__icontains=query))
        if self.action == "list":
            # The list never needs the full editor JSON.
            qs = qs.defer("content")
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return DocListSerializer
        return DocSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
