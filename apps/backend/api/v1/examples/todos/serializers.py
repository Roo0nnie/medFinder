"""
Todo serializers. Output uses camelCase (authorId, createdAt, updatedAt) to match frontend contract.
"""
from rest_framework import serializers
from .models import Todo


class TodoListSerializer(serializers.ModelSerializer):
    authorId = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Todo
        fields = ["id", "title", "completed", "authorId", "createdAt", "updatedAt"]

    def get_authorId(self, obj):
        return str(obj.author_id)


class TodoCreateInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, min_length=1)
    completed = serializers.BooleanField(default=False, required=False)


class TodoUpdateInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, min_length=1, required=False)
    completed = serializers.BooleanField(required=False)
