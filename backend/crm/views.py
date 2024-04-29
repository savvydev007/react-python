import time
from crm.manager import NetfreeProcessor
from crm.serializer import ActionsSerializer, NetfreeTrafficSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from crm.serializer import (
    EmailrequestSerializer, CategoriesSerializer,
    EmailTemplateSerializer, EmailTemplateListSerializer,
    EmailTemplateSchema
)
from utils.helper import (
    get_netfree_traffic_data, generate_unique_string,
    gmail_checker,capture_error
)
from django.conf import settings
from datetime import datetime,timedelta
from django.utils import timezone
import requests
from rest_framework import status
from .models import NetfreeCategoriesProfile
from .serializer import NetfreeCategoriesProfileSerializer
from crm.models import Emailrequest,NetfreeTraffic,Categories,Actions,EmailTemplate,SMTPEmail
import imaplib
import email
import traceback
import re
import uuid
import json
import logging
import sys
from django.core.cache import cache
from django.db import transaction
cronjob_log = logging.getLogger('cronjob-log')
cronjob_error_log = logging.getLogger('cronjob-error')


class NetfreeTrafficView(APIView):

    def get(self, request):
        params = self.request.query_params
        default = params.get("default")
        profile = params.get("profile")
        if profile is None:
            return Response({"error":"profile query param is missing."})
        netfree_profile = NetfreeCategoriesProfile.objects.filter(id=profile).first()
        if not netfree_profile:
            return Response({
                "success": False,
                "message": "profile id invalid"
            }, status=404)
        if default:
            netfree_traffic,created = NetfreeTraffic.objects.get_or_create(is_default=True,netfree_profile=netfree_profile)
            data = NetfreeTrafficSerializer(netfree_traffic).data
            return Response(
                {
                    "success": True,
                    "data": data
                }
            )
        
        if params.get("search", None):
            netfree_traffic = NetfreeTraffic.objects.filter(id=params.get("search", None))
            data = NetfreeTrafficSerializer(netfree_traffic,many=True).data
            return Response(
                {
                    "success": True,
                    "data": data
                }
            )
    def post(self, request):
        params = self.request.query_params
        data = request.data
        status = True if data.get('status') else False
        default_id = data.get('default_id')
        profile = params.get("profile")
        if profile is None:
            return Response({"error":"profile query param is missing."})
        netfree_profile = NetfreeCategoriesProfile.objects.filter(id=profile).first()
        if not netfree_profile:
            return Response({
                "success": False,
                "message": "profile id invalid"
            }, status=400)
        if default_id:
            netfree_traffic,created = NetfreeTraffic.objects.get_or_create(is_default=True,netfree_profile=netfree_profile)
        else:
            netfree_traffic,created = NetfreeTraffic.objects.get_or_create(is_default=True,netfree_profile=netfree_profile)
        netfree_traffic.is_active = status
        netfree_traffic.save()
        data = NetfreeTrafficSerializer(netfree_traffic).data
        return Response(
                {
                    "success": True,
                    "data": data
                }
            )
        
class NetfreeCategoriesProfileList(APIView):
    def get(self, request):
        categories = NetfreeCategoriesProfile.objects.all().order_by('id')
        serializer = NetfreeCategoriesProfileSerializer(categories, many=True)
        return Response(
                {
                    "success": True,
                    "data": serializer.data
                }
            )

    def post(self, request):
        serializer = NetfreeCategoriesProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NetfreeCategoriesProfileViewSet(APIView):
    queryset = NetfreeCategoriesProfile.objects.all()
    serializer_class = NetfreeCategoriesProfileSerializer

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('id'):
            return Response({"error":"id param is missing."})
        if not data.get('name'):
            return Response({"error":"name param is missing."})

        data['name'] = data['name'] + "_clone"
        # Get a list of category IDs from the request data
        actions = Actions.objects.filter(netfree_profile__id=data.get('id'))

        clone_profile = NetfreeCategoriesProfile.objects.create(name=data.get('name'),description=data.get('description',''))
        obj = NetfreeTraffic.objects.filter(netfree_profile__id=data.get('id')).first()
        if obj:
            NetfreeTraffic.objects.create(is_default=True,is_active=obj.is_active,netfree_profile=clone_profile)
        else:
            NetfreeTraffic.objects.create(is_default=True,netfree_profile=clone_profile)
        
        # Ensure the IDs exist in the database and create a list of category objects
        for action in actions:
            try:
                new_action = Actions(
                    label=action.label,
                    is_default=action.is_default,
                    is_default_netfree_traffic=action.is_default_netfree_traffic,
                    template=action.template,
                    email_template=action.email_template,  # Replace with an actual EmailTemplate instance
                    category=action.category,  # Replace with an actual Categories instance
                    email_to_admin=action.email_to_admin,
                    email_to_client=action.email_to_client,
                    custom_email=action.custom_email,
                    netfree_profile=clone_profile,  # Replace with an actual NetfreeCategoriesProfile instance
                )
                new_action.save()
            except Exception as e:
                # Handle the case where a specified category ID does not exist
                return Response(
                {
                    "success": True,
                    "message": "Something went wrong"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = NetfreeCategoriesProfileSerializer(clone_profile)
        return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
class NetfreeCategoriesProfileDetail(APIView):
    def get_object(self, pk):
        try:
            return NetfreeCategoriesProfile.objects.get(pk=pk)
        except NetfreeCategoriesProfile.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk):
        category = self.get_object(pk)
        serializer = NetfreeCategoriesProfileSerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = self.get_object(pk)
        serializer = NetfreeCategoriesProfileSerializer(category, data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        try:
            category = NetfreeCategoriesProfile.objects.get(pk=pk)
        except NetfreeCategoriesProfile.DoesNotExist:
            return Response({
                    "success": False,
                    "message": "Profile not found"
                },status=status.HTTP_404_NOT_FOUND)
        if category.is_default:
            return Response(
                {
                    "success": False,
                    "message": "You can't delete default profile"
                }
                ,status=status.HTTP_400_BAD_REQUEST
            )
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoriesView(APIView):

    def get(self, request):
        params = self.request.query_params
        lang = params.get("lang")
        profile = params.get("profile")
        if profile is None:
            return Response({"error":"profile query param is missing."})
        if lang is None:
            return Response({"error":"lang query param is missing."})
        
        profile_obj = NetfreeCategoriesProfile.objects.filter(id=profile).first()
        if not profile_obj:
            return Response({
                "success": False,
                "message": "profile id invalid"
            }, status=400)
        if params.get("search", None):
            response = self.search_category(params.get("search"))
            if response.status_code == 200:
                try:
                    keys = response.json()["tagValue"]["tags"].keys()
                    categories = list(map(int, keys))
                    instance = Categories.objects.filter(
                        categories_id__in=categories
                    )
                    serializer = CategoriesSerializer(instance, many=True, context = {"lang":lang,"profile_obj":profile_obj}).data
                except Exception:
                    serializer = []
        else:
            instance = Categories.objects.all().order_by("-id")
            serializer = CategoriesSerializer(instance, many=True, context = {"lang":lang,"profile_obj":profile_obj}).data
        return Response(
            {
                "success": True,
                "data": serializer
            }
        )

    def post(self, request):
        try:
            self.fetch_categories()
            return Response({
                "success": True,
                "message": "Updated successfully"
            }, status=200)
        except Exception:
            return Response({
                "success": False,
                "message": "Something went wrong, Please try again later"
            }, status=400)

    def put(self, request):
        param = request.data
        to_add = param.get("to_add", None)
        to_remove = param.get("to_remove", None)
        inputs = param.get("inputs", None)
        template_id = param.get("template_id", None)
        profile = self.request.query_params.get("profile")
        if profile is None:
            return Response({"error":"profile query param is missing."})

        if not to_add and not to_remove:
            return Response({
                "success": False,
                "message": "Add or Remove action required"
            }, status=400)
    
        if  to_add and  to_remove:
            return Response({
                "success": False,
                "message": "Can't perform both action at same time"
            }, status=400)

        if template_id:
            if not str(template_id).isdigit():
                return Response({
                "success": False,
                "message": "Invalid inputs"
                }, status=400)
            
        try:
            netfree_profile = NetfreeCategoriesProfile.objects.get(id=profile)
            instance = Categories.objects.get(
                categories_id=param.get("id")
            )
            if to_add:
                action = Actions.objects.get(
                    id=to_add
                )

                if inputs and action.label.count("X") > len(inputs.keys()):
                    return Response({
                        "success": False,
                        "message": "Invalid inputs"
                    }, status=400)
            
                if template_id:
                    template = EmailTemplate.objects.get(
                        id=template_id
                    )
                    email_to_admin = inputs.get('email_to_admin')
                    email_to_client = inputs.get('email_to_client')
                    custom_email = inputs.get('custom_email',"")
                    if not email_to_admin and not email_to_client and custom_email == "":
                        return Response(
                                    {
                                        "success": False,
                                        "message": "Select min one options"

                                    }, status=400
                                )
                    if custom_email:
                        custom_email = custom_email
                    if request.GET.get('status','') == 'update':
                        if not request.GET.get('id'):
                            return Response({
                                "success": False,
                                "message": "Invalid action id"
                            }, status=400)

                        action_obj = Actions.objects.filter(id=request.GET.get('id','')).first()
                        if not action_obj:
                            return Response({
                                "success": False,
                                "message": "Invalid action id"
                            }, status=400)
                        action_obj.email_template = template
                        action_obj.email_to_admin = email_to_admin
                        action_obj.email_to_client = email_to_client
                        action_obj.custom_email = custom_email
                        action_obj.save()

                    else:
                        action_instance, _ = Actions.objects.filter(template=False).get_or_create(label = "Send email template",email_template=template,category=instance,email_to_admin=email_to_admin,email_to_client=email_to_client,custom_email=custom_email,netfree_profile=netfree_profile)
                else:
                    action, _ = Actions.objects.get_or_create(
                    label=action.label.replace('X', inputs.get("amount",""), 1).replace('X', inputs.get("openfor",""), 1),
                    category=instance,netfree_profile=netfree_profile
                )

            if to_remove:
                action = Actions.objects.get(
                    category=instance,
                    id=to_remove,
                ).delete()
            return Response({
                "success": True,
                "message": "Action updated"
            }, status=200)
        except Categories.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid category id"
            }, status=400)

        except Actions.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid action id"
            }, status=400)
        except NetfreeCategoriesProfile.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid profile id"
            }, status=400)
        except Exception as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=400)

    def fetch_categories(self):
        response = self.api_request()

        if response.status_code == 200:
            categories = response.json().get("list")
            # Process the categories and save them to your database
            for category in categories:
                category_id = category['id']
                category_description = category['description']
                Categories.objects.update_or_create(
                    categories_id=category_id,
                    defaults={
                        "description": category_description
                    }
                )

            # Return or process the categories as needed
            return True
        return False

    def api_request(self):
        login_url = 'https://netfree.link/api/user/login-by-password'
        tags_url = 'https://netfree.link/api/tags/list'
        headers = {
            'authority': 'netfree.link',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://netfree.link',
            'referer': 'https://netfree.link/app/',
            'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
        }
        login_data = {
            'password': settings.USER_PASSWORD,
            'phone': settings.USERNAME
        }
        # Static for testing only
        tags_data = {
            'inspector': True
        }
        session = requests.Session()
        login_response = session.post(login_url, headers=headers, json=login_data)
        cookie = login_response.cookies.get_dict()
        headers['cookie'] = '; '.join([f"{name}={value}" for name, value in cookie.items()])
        tags_response = session.post(tags_url, headers=headers, json=tags_data)

        return tags_response

    def search_category(self, params):
        url = "https://netfree.link/api/tags/value/edit/get"
        login_url = 'https://netfree.link/api/user/login-by-password'

        USER_PASSWORD = settings.USER_PASSWORD
        USERNAME = settings.USERNAME

        login_data = {
            'password': USER_PASSWORD,
            'phone': USERNAME
        }

        valid_domain = self.find_domain(params)
        domain = valid_domain.json().get("foundHost","") if valid_domain.status_code == 200 else ""
        payload = json.dumps({
            "host": str(domain)
        })
        headers = {
            'authority': 'netfree.link',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'origin': 'https://netfree.link',
            'referer': 'https://netfree.link/app/',
            'save-data': 'on',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }

        session = requests.Session()
        login_response = session.post(login_url, headers=headers, json=login_data)
        cookie = login_response.cookies.get_dict()
        headers['cookie'] = '; '.join([f"{name}={value}" for name, value in cookie.items()])
        tags_response = session.post(url, headers=headers, data=payload)
        return tags_response

    def find_domain(self, params):
        url = "https://netfree.link/api/tags/search-url"
        login_url = 'https://netfree.link/api/user/login-by-password'

        USER_PASSWORD = settings.USER_PASSWORD
        USERNAME = settings.USERNAME

        login_data = {
            'password': USER_PASSWORD,
            'phone': USERNAME
        }

        payload = json.dumps({
            "search": params
        })
        headers = {
            'authority': 'netfree.link',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'content-type': 'application/json',
            'origin': 'https://netfree.link',
            'referer': 'https://netfree.link/app/',
            'save-data': 'on',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }

        session = requests.Session()
        login_response = session.post(login_url, headers=headers, json=login_data)
        cookie = login_response.cookies.get_dict()
        headers['cookie'] = '; '.join([f"{name}={value}" for name, value in cookie.items()])
        response = session.post(url, headers=headers, data=payload)
        return response

class FetchUserSettingsView(APIView):

    def get(self, *args, **options):
        user_id = 7722 # Static for testing
        url = f"https://netfree.link/api/user/get-filter-settings?id={user_id}"
        response = requests.get(url)
        data = response.json()
        return Response(data)


class EmailRequestView(APIView):

    def get(self, *args, **options):
        params = self.request.query_params
        lang = params.get("lang")
        queryset = Emailrequest.objects.all().order_by("-id")
        serializer = EmailrequestSerializer(
            queryset, many=True,context = {"lang":lang}
        )
        return Response(
            {
                "success": True,
                "data": serializer.data

            }
        )


class ActionsView(APIView):

    def get(self, *args, **options):
        params = self.request.query_params
        lang = params.get("lang")
        if lang is None:
            return Response({"error":"lang query param is missing."})
        profile = params.get("profile")
        if profile is None:
            return Response({"error":"profile query param is missing."})
    
        netfree_profile = NetfreeCategoriesProfile.objects.filter(id=profile).first()
        if not netfree_profile:
            return Response({
                "success": False,
                "message": "profile id invalid"
            }, status=400)
        
        queryset = Actions.objects.filter(template=1)
        if params.get("default", 0):
            values_list = queryset.filter(is_default=True)
            values_list = ActionsSerializer(values_list,many=True, context = {"lang":lang}).data
        else:
            values_list = queryset
            values_list = ActionsSerializer(values_list,many=True, context = {"lang":lang}).data

        if params.get('get_default',None):
            values_list = Actions.objects.filter(is_default=True,netfree_profile=netfree_profile)
            values_list = ActionsSerializer(values_list,many=True, context = {"lang":lang}).data

        if params.get('get_netfree_traffic',None):
            values_list = Actions.objects.filter(is_default_netfree_traffic=True,netfree_profile=netfree_profile)
            values_list = ActionsSerializer(values_list,many=True, context = {"lang":lang}).data

        return Response(
            {
                "success": True,
                "data": values_list

            }
        )

    def post(self, request):
        params = self.request.query_params
        actions = request.data.get("actions", None)
        to_add = request.data.get("to_add", None)
        profile = params.get("profile",'1')
        if profile is None:
            return Response({"error":"profile query param is missing."})
    
        if to_add:
            to_add = int(to_add)
            if not isinstance(to_add,int):
                return Response({
                            "success": False,
                            "message": "Invalid inputs"
                        }, status=400)

        inputs = request.data.get("inputs", None)
        template_id = request.data.get("template_id", None)
        ids = Actions.objects.filter(template=1).values_list("id",flat=True)
        all_actions = Actions.objects.all()
        updated_list = []
        queryset = all_actions.filter(id__in=actions)
        netfree_profile = NetfreeCategoriesProfile.objects.filter(id=profile).first()
        if not netfree_profile:
            return Response({
                "success": False,
                "message": "profile id invalid"
            }, status=400)

        for action in queryset:
            if to_add and to_add in ids and to_add == action.id:
                if inputs and action.label.count("X") > len(inputs.keys()):
                        return Response({
                            "success": False,
                            "message": "Invalid inputs"
                        }, status=400)
                
                if str(template_id).isdigit():
                    template = EmailTemplate.objects.get(
                        id=template_id
                    )
                    email_to_admin = inputs.get('email_to_admin')
                    email_to_client = inputs.get('email_to_client')
                    custom_email = inputs.get('custom_email',"")
                    if not email_to_admin and not email_to_client and custom_email == "":
                        return Response(
                                    {
                                        "success": False,
                                        "message": "Select min one options"

                                    }, status=400
                                )

                    if "Send email template" in action.label:
                        if request.GET.get('status','') == 'update':
                            if not request.GET.get('id'):
                                return Response({
                                    "success": False,
                                    "message": "Invalid action id"
                                }, status=400)

                            instance = Actions.objects.filter(id=request.GET.get('id','')).first()
                            if not instance:
                                return Response({
                                    "success": False,
                                    "message": "Invalid action id"
                                }, status=400)
                            instance.email_template = template
                            instance.email_to_admin = email_to_admin
                            instance.email_to_client = email_to_client
                            instance.custom_email = custom_email
                            instance.save()
                        else:
                            if request.GET.get('is_netfree_traffic'):
                                instance, _ = Actions.objects.filter(template=False).get_or_create(label = "Send email template",category=None,is_default_netfree_traffic=True,email_template=template,email_to_admin=email_to_admin,email_to_client=email_to_client,custom_email=custom_email,netfree_profile=netfree_profile)
                                return Response(
                                    {
                                        "success": True,
                                        "message": "Netfree traffic Default actions set successfully"

                                    }
                                )
                            instance, _ = Actions.objects.filter(template=False).get_or_create(label = "Send email template",category=None,email_template=template,email_to_admin=email_to_admin,email_to_client=email_to_client,custom_email=custom_email,netfree_profile=netfree_profile,is_default=1)
                else:
                    instance, _ = Actions.objects.filter(template=False).get_or_create(
                    label=action.label.replace('X', inputs.get("amount",""), 1).replace('X', inputs.get("openfor",""), 1),category=None,netfree_profile=netfree_profile,is_default=1
                    )
                updated_list.append(instance.id)
            else:
                updated_list.append(action.id)


        return Response(
            {
                "success": True,
                "message": "Default actions set successfully"

            }
        )

    def put(self, request):
        action = request.data.get("action")
        label = request.data.get("label")

        try:
            instance = Actions.objects.get(id=action)
            instance.label = label
            instance.save()
            return Response(
                {
                    "success": True,
                    "message": "Action updated"

                }, status=200
            )
        except Actions.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid action id"

                }, status=400
            )
    
    def delete(self, request):
        action = request.GET.get('action_id')
        try:
            instance = Actions.objects.get(id=action)
            instance.delete()
            return Response(
                {
                    "success": True,
                    "message": "Action deleted"
                }, status=200
            )
        except Actions.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid action id"
                }, status=400
            )


class EmailTemplatesView(APIView):

    def get(self, request):
        params = self.request.query_params
        queryset = EmailTemplate.objects.all()
        serializer = None
        if params.get("id"):
            email_template = queryset.filter(id=params.get("id")).last()
            if not email_template:
                return Response(
                    {
                        "success": True,
                        "message": "Invalid template id"

                    }
                )
            serializer = EmailTemplateSerializer(email_template)
        else:
            serializer = EmailTemplateListSerializer(queryset, many=True)
        return Response(
            {
                "success": True,
                "data": serializer.data

            }
        )

    def post(self, request):

        serializer = EmailTemplateSchema(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        body = payload.get("body", {})
        EmailTemplate.objects.create(
            name=payload.get("name", ""),
            email_to=payload.get("email_to", ""),
            subject=payload.get("subject", ""),
            design=body.get("design", {}),
            html=body.get("html", "")
        )
        return Response(
            {
                "success": True,
                "message": "created successfully"

            }
        )

    def patch(self, request):
        try:
            instance = EmailTemplate.objects.get(
                id=request.data.get("id")
            )
        except EmailTemplate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid template id"

                }
            )
        body = request.data.pop("body", {})
        payload = request.data
        if body.get("design", None):
            payload["design"] = body.get("design", None)
        if body.get("html", None):
            payload["html"] = body.get("html", None)
        serializer = EmailTemplateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.html = payload["html"]
        instance.save()

        return Response(
            {
                "success": True,
                "message": "Added successfully"

            }
        )

    def delete(self, request):
        params = self.request.query_params
        try:
            instance = EmailTemplate.objects.get(
                id=params.get("id")
            )
            instance.delete()
            return Response(
                {
                    "success": True,
                    "message": "Template removed successfully"

                }
            )
        except EmailTemplate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid template id"

                }
            )


class EmailTemplatesCloneView(APIView):

    def post(self, request):
        try:
            email_template = EmailTemplate.objects.get(
                pk=request.data.get("id")
            )
            name = ""
            unique_string = generate_unique_string()

            name = email_template.name + unique_string

            EmailTemplate.objects.create(
                name=name,
                email_to=email_template.email_to,
                subject=email_template.subject,
                html=email_template.html,
                design=email_template.design,
            )
            return Response(
                {
                    "success": True,
                    "message": "Template cloned successfully"

                }
            )
        except EmailTemplate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid template id"

                }
            )


class SendEmailView(APIView):

    def post(self, request):
        template_id = request.data.get(
            "template_id", None
        )
        request_id = request.data.get(
            "request_id", None
        )
        try:
            template = EmailTemplate.objects.get(
                id=template_id
            )
            email_request = Emailrequest.objects.get(
                id=request_id
            )
        except EmailTemplate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid template id"

                }, status=400
            )
        except Emailrequest.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid emailrequest id" 

                }
            )
        subject = email_request.id
        to_email = email_request.sender_email
        template_name = "email.html"

        format_variables = {
            "request_id": email_request.id,
            "client_name": email_request.username,
            "client_email": email_request.sender_email,
            "admin_email": "netfree-test@mailinator.com",
            "domain_requested": email_request.requested_website
        }
        context = {
            "your_string": template.body.format(**format_variables)
        }
        # send_email_with_template(subject, to_email, template_name, context)   
        return Response(
            {
                "success": True,
                "data": "Email sent"

            }
        )


class SMTPEmailView(APIView):

    def get(self, request):
        try:
            params = self.request.query_params
            smtp_email = SMTPEmail.objects.last()
            return Response(
                {
                    "success": True,
                    "data": {
                        "id": smtp_email.id,
                        "email": smtp_email.email,
                        "password": ""
                    }

                }
            )
        except Exception:
            return Response(
                {}
            )

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        try:
            response = gmail_checker(email, password)
            if gmail_checker(email, password):
                SMTPEmail.objects.get_or_create(
                    email=email,
                    password=password
                )
                return Response(
                    {
                        "success": True,
                        "message": "Added successfully"

                    }
                )
            return Response(
                    {
                        "success": False,
                        "message": "Invalid username or password"

                    }, status=400
                )
        except SMTPEmail.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Invalid params"

                }
            )


class ReadEmail():
    def _get_last_processed_timestamp(self, key):
        last_processed = cache.get(key + '_last_processed_timestamp')
        if last_processed is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return datetime.strptime(last_processed, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)

    def _update_last_processed_timestamp(self, key, timestamp):
        cache.set(key + '_last_processed_timestamp', timestamp)

    def read_email_from_gmail(self):
        print("working!!")
        cronjob_log.info(f"Cronjob start at {datetime.now()}")

        instance = SMTPEmail.objects.last()
        FROM_EMAIL = ""
        FROM_PWD = ""
        if instance:
            FROM_EMAIL = instance.email
            FROM_PWD = instance.password

        try:
            imap_server = imaplib.IMAP4_SSL(settings.SMTP_SERVER)

            login_result = imap_server.login(FROM_EMAIL, FROM_PWD)
            
            if login_result[0] == 'OK':
                print("Logged in successfully!")
            else:
                cronjob_log.info(f"Cronjob Login failed. at {datetime.now()}")
                return

            # __, folder_list = imap_server.list()
            # print("IGIUGUUI", folder_list)
            status, mailbox_list = imap_server.list()
            mail_box = '"[Gmail]/All Mail"'
            if status=="OK":
                for i in mailbox_list:
                    if '"[Gmail]/&BdsF3A- &BdQF0wXVBdAF6A-"' in str(i):
                        mail_box = '"[Gmail]/&BdsF3A- &BdQF0wXVBdAF6A-"'
            mail_boxs = [mail_box]
            for folder in mail_boxs:
                imap_server.select(folder)

                subject = "Request from user"
                search_criteria = f'(SUBJECT "{subject}")'

                one_day_ago = (datetime.now().strftime('%d-%b-%Y'))
                search_criteria = f'(SINCE "{one_day_ago}")'
                status, message_ids = imap_server.search(None,search_criteria)
                
                # Fetch and process the email messages
                message_ids = message_ids[0].split()
                key = folder+one_day_ago
                key2 = folder+one_day_ago+"count"
                if folder == '"[Gmail]/All Mail"':
                    key = "all-mail"+one_day_ago
                    key2 = "all-mail"+one_day_ago+"count"
                old_ids = cache.get(key)
                count = cache.get(key2)
                cronjob_log.info(f"debug old ids key: {key} {str(old_ids)} : count key {key2}: {count}")
                is_delete = False
                if not old_ids:
                    old_ids = []
                if not count:
                    cache.set(key2,len(old_ids), timeout=86400)
                    count = len(old_ids)
                new = []
                if len(message_ids)>count:
                    new = [item for item in message_ids if item not in old_ids]
                    cronjob_log.info(f"{len(new)} mail recived")
                elif len(message_ids)==count:
                    cronjob_log.info("no new emails")
                    break
                elif len(message_ids)<count:
                    diffrence = count - len(message_ids)
                    is_delete = True
                    new = message_ids[-diffrence:]
                    cronjob_log.info(f"{len(new)} mail delete, sync again")
                cronjob_log.info(f"old mesages ids {str(old_ids)}")
                cronjob_log.info(f"fetched ids {str(message_ids)}")
                cronjob_log.info(f"new messages ids {str(new)}")
                for message_id in new:
                    try:
                        mail_read = True
                        response, data = imap_server.fetch(message_id, '(FLAGS)')
                        if response == 'OK':
                            flags = data[0].split()[2]  # Flags are in the third element
                            if b'\Seen' not in flags:
                                mail_read =False
                        try:
                            _ , response = imap_server.fetch(message_id, '(UID)')
                            uid = response[0].split()[2].decode().replace(")", "")
                        except Exception:
                            uid = uuid.uuid4()

                        status, message_data = imap_server.fetch(message_id, '(RFC822)')
                        raw_email = message_data[0][1]
                        email_message = email.message_from_bytes(raw_email)

                        subject = email_message.get('Subject')
                        decoded_subject = email.header.decode_header(subject)

                        # Combine the parts of the decoded subject into a single string
                        subject = ""
                        for part, encoding in decoded_subject:
                            if isinstance(part, bytes):
                                subject += part.decode(encoding or 'utf-8', errors='ignore')
                            else:
                                subject += part
                        try:
                            target_sub = subject.split("#")[0][::-1]
                        except:
                            target_sub = ""
                        matching_str = "שמתשמ תאמ הינפ"
                        if email_message.is_multipart():
                            # If the email has multiple parts, iterate over them
                            for part in email_message.walk():
                                if part.get_content_type() == "text/plain":
                                    body = part.get_payload(decode=True).decode()
                                    break
                        else:
                            body = email_message.get_payload(decode=True).decode()
                        pattern = r'(https?://\S+)'
                        match = re.search(pattern, body)
                        website_url = ""
                        if match:
                            website_url = match.group(1)
                        if (len(target_sub) >0 and target_sub in " שמתשמ תאמ הינפ") or website_url.startswith("https://netfree.link/app/#/tools/traffic/view"):



                            email_subject = subject
                            customer_id = email_subject.split("#")[-1]
                            username, sender_email = self.decode_header(email_message['From'])
                            decoded_username = email.header.decode_header(username)
                            # Combine the parts of the decoded subject into a single string
                            subject = ""
                            for username_part, username_encoding in decoded_username:
                                if isinstance(username_part, bytes):
                                    username =  username_part.decode(username_encoding or 'utf-8', errors='ignore')

                                else:
                                    username = username_part
                            received_date = email_message['Date']
                            received_datetime = datetime.strptime(received_date, "%a, %d %b %Y %H:%M:%S %z")
                            formatted_received_date = received_datetime.strftime("%Y-%m-%d %H:%M:%S %z")
                            created_at_datetime = timezone.datetime.strptime(received_date, "%a, %d %b %Y %H:%M:%S %z")
                            if website_url.startswith("https://netfree.link/app/#/tools/traffic/view"):
                                from clients.models import NetfreeUser
                                data,custumer_id = get_netfree_traffic_data(website_url)
                                client = NetfreeUser.objects.filter(user_id=custumer_id).first()
                                if client:
                                    netfree_traffic= NetfreeTraffic.objects.get(is_default=True,netfree_profile=client.netfree_profile)
                                else:
                                    default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
                                    netfree_traffic,created = NetfreeTraffic.objects.get_or_create(is_default=True,netfree_profile=default_netfree_categories)
                                if netfree_traffic.is_active:
                                    # obj = NetfreeProcessor(data,custumer_id)
                                    # obj.process()
                                    objects = Emailrequest.objects.filter(
                                            email_id=uid,
                                            created_at=created_at_datetime
                                        )
                                    for url in data:
                                        for email_request in objects:
                                            if str(email_request.requested_website)==str(url):
                                                cronjob_log.debug(f"Cronjob  email request updated {email_request.id} at {datetime.now()}")
                                                break
                                        else:
                                            new_obj = Emailrequest.objects.create(email_id=uid,requested_website=url,created_at=created_at_datetime,sender_email=sender_email,
                                                                                username=username,customer_id=str(custumer_id),request_type="טיפול בהקלטות תעבורה",
                                                                                text=body,ticket_id=15665)
                                            cronjob_log.debug(f"Cronjob email request created {new_obj.id} at {datetime.now()}")
                            else: 
                                with transaction.atomic():
                                    object,created = Emailrequest.objects.update_or_create(
                                        email_id=uid,
                                        created_at=created_at_datetime,
                                        defaults={
                                            "sender_email": sender_email,
                                            "username": username,
                                            "customer_id": customer_id,
                                            "requested_website": website_url,
                                            "text": body,
                                            "created_at": created_at_datetime,
                                            "ticket_id": 15665,
                                        }
                                    )
                                    if created:
                                        cronjob_log.debug(f"Cronjob email request created {object.id} at {datetime.now()}")
                                    else:
                                        cronjob_log.debug(f"Cronjob  email request updated {object.id} at {datetime.now()}")
                        if not mail_read:
                            imap_server.store(message_id, '-FLAGS', '\Seen')
                    except Exception as e:
                        print(e)
                        cronjob_error_log.error(f"Cronjob error exception: {capture_error(sys.exc_info())}")

                # Close the connection
                if is_delete:
                    cache.set(key, message_ids,timeout=86400)
                    cache.set(key2,len(message_ids),timeout=86400)
                else:
                    combine = new+old_ids
                    cache.set(key, combine,timeout=86400)
                    cache.set(key2,len(combine),timeout=86400)
            

            imap_server.close()
            imap_server.logout()
            print("Done!!!")
            cronjob_log.info(f"Cronjob done at {datetime.now()}")

        except Exception as e:
            traceback.print_exc()
            print("Error!!!")
            print(str(e))
            cronjob_error_log.error(f"Cronjob error : {str(e)}")
            cronjob_error_log.error(f"Cronjob error exception: {capture_error(sys.exc_info())}")

    def decode_header(self, value):
        try:
            username = value.split("<")[0]
            email = value.split("<")[-1].replace(">", "")
        except Exception:
            username = ""
            email = value
        return username, email


# res = ReadEmail()
# res.read_email_from_gmail()