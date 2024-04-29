from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from . import serializers
from rest_framework.views import APIView
from rest_framework.response import Response


User = get_user_model()


class LoginView(TokenObtainPairView):
    serializer_class = serializers.LoginSerializer


class SignupView(APIView):
    serializer_class = serializers.UserSignupSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True) 
        serializer.save()
        return Response(serializer.data)
