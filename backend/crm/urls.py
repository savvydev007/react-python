from django.urls import path
from crm import views


urlpatterns = [
     path("category/", views.CategoriesView.as_view()),
     path("netfree-traffic/", views.NetfreeTrafficView.as_view()),
     path("settings/", views.FetchUserSettingsView.as_view()),
     path("requests/", views.EmailRequestView.as_view()),
     path("actions/", views.ActionsView.as_view()),
     path("template/", views.EmailTemplatesView.as_view()),
     path("send-email/", views.SendEmailView.as_view()),
     path("template-clone/", views.EmailTemplatesCloneView.as_view()),
     path("smtp-email/", views.SMTPEmailView.as_view()),
     path('netfree-categories-profile/', views.NetfreeCategoriesProfileList.as_view(), name='netfree-categories-profile-list'),
     path("netfree-categories-profile-clone/", views.NetfreeCategoriesProfileViewSet.as_view()),
     path('netfree-categories-profile/<int:pk>/', views.NetfreeCategoriesProfileDetail.as_view(), name='netfree-categories-profile-detail')
]
