import csv
from django.db import transaction
from clients.models import Block, BlockField, Client, NetfreeCategoriesProfile
from clients.resources import NetfreeUserExportResource
from clients.serializer import ClientAttributeSerializer, NetfreeUserSerializer,ClientAttributeSerializerCustom,ClientListSerializer, get_blocks
from django.http import HttpResponse
from eav.models import Attribute,EnumGroup,EnumValue
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
import datetime
from rest_framework.pagination import PageNumberPagination
from django.core.paginator import Paginator
from django.core.paginator import EmptyPage
from django.core.paginator import PageNotAnInteger

# Create your views here.
class ClientsList(APIView):
    def get(self, request):
        params = self.request.query_params
        lang = params.get("lang")
        clients = Client.objects.all().order_by('id')
        page = request.GET.get('page', 1)  # Get the requested page from the query parameters
        page_size = 10  # Define the number of clients per page# Get the page size from the query parameters

        # Calculate the start and end indices for the current page
        start_index = (int(page) - 1) * page_size
        end_index = int(page) * page_size

        paginator = Paginator(clients, page_size)

        try:
            clients_page = paginator.page(page)
        except PageNotAnInteger:
            # If page is not an integer, default to the first page.
            clients_page = paginator.page(1)
        except EmptyPage:
            # If page is out of range (e.g., page 9999), return an empty page.
            clients_page = paginator.page(paginator.num_pages)
        clients = clients[start_index:end_index]
        data = []
        blocks = Block.objects.all()
        fields = []
        check_fields = []
        for block in blocks:
            block_info = BlockField.objects.filter(block=block,display=True).order_by('display_order')
            for block_field in block_info:
                if lang=='he':
                    fields.append({block_field.attribute.slug:block_field.field_name_language.get(lang) if block_field.field_name_language.get(lang) else block_field.attribute.name})
                else:
                    fields.append({block_field.attribute.slug:block_field.attribute.name})
                check_fields.append(block_field.attribute.slug)

        client_data1 = {}
        for field in fields:
            client_data1[list(field.keys())[0]]=''
        for client in clients:
            client_data = client_data1.copy()
            client_data['id']=client.id
            client_data['netfree_profile']=client.netfree_profile.id
            for client_eav in client.eav_values.all():
                # if client_eav.attribute.slug in check_fields:
                if client_eav.attribute.datatype == 'enum':
                    client_data[client_eav.attribute.slug] = {"id": client_eav._get_value().id,"value":  client_eav._get_value().value}
                else:
                    client_data[client_eav.attribute.slug] = client_eav._get_value()
            data.append(client_data)
        response_data = {
            "success": True,
            'field':fields,
            "data": data,
            "page": clients_page.number, 
            "num_pages": paginator.num_pages,
            "next":None,
            "previous":None,
            "count":paginator.count
        }
        if clients_page.has_next():
            response_data["next"] = request.build_absolute_uri(f"?page={clients_page.next_page_number()}")
        if clients_page.has_previous():
            response_data["previous"] = request.build_absolute_uri(f"?page={clients_page.previous_page_number()}")

        return Response(response_data)

    def post(self, request):
        data = self.request.data
        fields = data.get('fields', [])
        netfree_profile = data.get('netfree_profile')
        if not netfree_profile:
            return Response({"error": "netfree_profile is required"}, status=status.HTTP_400_BAD_REQUEST)
        net = NetfreeCategoriesProfile.objects.filter(id=netfree_profile).first()
        if not net:
            return Response({"error": "netfree_profile not valid"}, status=status.HTTP_400_BAD_REQUEST)
        client = Client(netfree_profile=net)
        block_data = get_blocks()
        missing_keys = [key for key, value in block_data.items() if value['required'] and key not in [list(d.keys())[0] for d in fields]]

        process_data = []
        for index,item in enumerate(fields):
            key, value = next(iter(item.items()))
            data = block_data.get(key)
            if value=="" and not data.get('required'):
                value = None
            process_data.append({key:value})
                


        if missing_keys:
            for i in missing_keys:
                return Response({"error": f"{i} Field is required"}, status=status.HTTP_400_BAD_REQUEST) 

        for field in process_data:
            for key, item in field.items():
                key_data = get_blocks().get(key)
                if not key_data:
                    return Response({"error": "Fields are invalid"}, status=status.HTTP_400_BAD_REQUEST)

                if key_data.get('required') and not key_data.get('defaultvalue'):
                    if not item:
                        return Response({"error": "Field is required"}, status=status.HTTP_400_BAD_REQUEST)

                if key_data.get('unique'):
                    dicts = {f'eav__{key}': item}
                    obj = Client.objects.filter(**dicts).first()
                    if obj:
                        return Response({"error": f"{key} is already exist"}, status=status.HTTP_400_BAD_REQUEST)

                if key_data.get('defaultvalue'):
                    item = item or key_data.get('defaultvalue')

                attr_name = key

                if key_data.get('data_type') == 'select':
                    item = EnumValue.objects.filter(id=item).first()
                if key_data.get('data_type') == 'date':
                    item = datetime.datetime.strptime(item, "%Y-%m-%dT%H:%M:%S.%fZ")
                setattr(client.eav, attr_name, item)


        client.save()

        # Use a serializer to return the created client
        serializer = ClientListSerializer(client)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ClientsDetail(APIView):
    # Helper method to get a Client object by primary key
    def parse_datetime_with_milliseconds(self,item):
        try:
            # Try to parse with milliseconds
            return datetime.datetime.strptime(item, "%Y-%m-%dT%H:%M:%S.%fZ")
        except ValueError:
            try:
                # Try to parse without milliseconds
                return datetime.datetime.strptime(item, "%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                # Handle the case where neither format matches
                raise ValueError("Datetime string does not match the expected format")
    def get_object(self, pk):
        try:
            return Client.objects.get(pk=pk)
        except Client.DoesNotExist:
            return None  # Return None instead of creating a new Client object

    # Handle GET request to retrieve a client's details
    def get(self, request, pk):
        client = self.get_object(pk)
        if client is not None:
            serializer = ClientListSerializer(client)
            return Response(serializer.data)
        else:
            return Response({"success": False, "message": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    # Handle PUT request to update client's attributes
    def put(self, request, pk):
        data = request.data
        fields = data.get('fields', [])
        client = self.get_object(pk)
        block_data = get_blocks()
        process_data = []
        for index,item in enumerate(fields):
            key, value = next(iter(item.items()))
            data = block_data.get(key)
            if value=="" and not data.get('required'):
                value = None
            process_data.append({key:value})

        netfree_profile = data.get('netfree_profile')
        if netfree_profile:
            net = NetfreeCategoriesProfile.objects.filter(id=netfree_profile).first()
            client.netfree_profile = net
            client.save()
            if not net:
                return Response({"error": "netfree_profile not valid"}, status=status.HTTP_400_BAD_REQUEST)
        
        if client is not None:
            eav = client.eav
            for field in process_data:
                for key, item in field.items():
                    field_data = block_data.get(key)
                    if not field_data:
                        return Response({"error": "Fields are invalid"}, status=status.HTTP_400_BAD_REQUEST)
                    if field_data.get('unique'):
                        dicts = {f'eav__{key}': item}
                        obj = Client.objects.filter(**dicts).first()
                        if obj and getattr(client.eav,key) != item:
                            return Response({"error": f"{key} is already exist"}, status=status.HTTP_400_BAD_REQUEST)
                    if field_data.get('data_type') == 'select':
                        ob = BlockField.objects.get(id=field_data.get('id'))
                        values = ob.attribute.enum_group.values.all()
                        for value in values:
                            if str(value.id) == str(item):
                                setattr(client.eav, key, value)
                    elif field_data.get('data_type') == 'date':
                        item = self.parse_datetime_with_milliseconds(item)
                        setattr(client.eav, key, item)
                    else:
                        setattr(client.eav, key, item)
            
            client.save()

            return Response({
                "success": True,
                "data": data
            }, status=status.HTTP_206_PARTIAL_CONTENT)
        else:
            return Response({"success": False, "message": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    # Handle DELETE request to delete a client
    def delete(self, request, pk):
        client = self.get_object(pk)
        
        if client is not None:
            client.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"success": False, "message": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
    

class ClientsExportData(APIView):
    def get(self, request):
        data = request.data
        client_ids = data.get('clients_ids',[])
        if client_ids:
            clients = Client.objects.filter(id__in=client_ids).order_by('id')
        else:
            clients = Client.objects.all().order_by('id')
        if not clients.exists():
            return Response({"error":"no data"})
        data = []
        blocks = Block.objects.all().order_by('display_order')
        fields = []
        for block in blocks:
            block_info = BlockField.objects.filter(block=block,display=True).order_by('display_order')
            for block_field in block_info:
                fields.append(block_field.attribute.name)

        client_data1 = {}
        for field in fields:
            client_data1[field]=''
        for client in clients:
            client_data = client_data1.copy()
            client_data['id'] = client.id
            for client_eav in client.eav_values.all():
                if client_eav.attribute.name in fields:
                    if client_eav.attribute.datatype == 'enum':
                        client_data[client_eav.attribute.name] = client_eav._get_value().value
                    else:
                        client_data[client_eav.attribute.name] = client_eav._get_value()
            data.append(client_data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="clients.csv"'
        # Create a CSV writer and write the header
        if not data:
            return Response({"error":"no fields for display"})
        fieldnames = list(data[0].keys())

        # Reverse the fieldnames
        fieldnames.reverse()
        csv_writer = csv.DictWriter(response, fieldnames=fieldnames)
        csv_writer.writeheader()

        # Write the data rows
        for row in data:
            csv_writer.writerow(row)
        return response
    
class ClientsFields(APIView):
    def check_datatype(self, option):
        type_dict = {
            'text': 'TYPE_TEXT',
            'number': 'TYPE_INT',
            'decimal': 'TYPE_FLOAT',
            'phone': 'TYPE_INT',
            'email': 'TYPE_TEXT',
            'select': 'TYPE_ENUM',
            'date': 'TYPE_DATE',
            'checkbox': 'TYPE_BOOLEAN',
            'int': 'TYPE_INT',
            'object': 'TYPE_OBJECT',
            'enum': 'TYPE_ENUM',
            'json': 'TYPE_JSON',
            'csv': 'TYPE_CSV',
        }
        return type_dict.get(option)

    def get_block_fields_data(self, block):
        attr = []
        block_info = BlockField.objects.filter(block=block).order_by('display_order')
        for info in block_info:
            client_data = ClientAttributeSerializer(info).data
            attr.append(client_data)
        return {
            "is_delete":block.is_delete,
            "is_editable":block.is_editable,
            "display_order":block.display_order,
            'block_id': block.id,
            'block': block.name,
            'field_name_language': block.field_name_language,
            'field': attr,
        }

    def get(self, request):
        data = []
        blocks = Block.objects.all()
        for block in blocks:
            block_fields_data = self.get_block_fields_data(block)
            data.append(block_fields_data)
        return Response({'result': data}, status=status.HTTP_200_OK)

    def post(self, request):
        data = self.request.data
        is_block_created = data.get('is_block_created')
        required = bool(data.get('required'))
        defaultvalue = data.get('defaultvalue')
        value = data.get('value')
        unique = bool(data.get('unique'))
        display = bool(data.get('display'))
        name_he = data.get('field_name_language')

        if is_block_created:
            block = Block.objects.create(name=data.get('name'),field_name_language=data.get('field_name_language'))
            return Response({'data': data}, status=status.HTTP_201_CREATED)

        data_type = self.check_datatype(data.get('data_type'))
        if not data_type:
            return Response({'errors': [{'data_type': "Data Type not valid"}]},status=status.HTTP_400_BAD_REQUEST)

        block = Block.objects.filter(id=data.get('block_id')).first()
        if not block:
            return Response({'errors': [{'block': "block not valid"}]}, status=status.HTTP_400_BAD_REQUEST)

        datatype = getattr(Attribute, data_type)
        if datatype == "enum":
            values = value.split(',')
            en_group, _ = EnumGroup.objects.get_or_create(name=data.get('name').capitalize())
            for i in values:
                enum_value, _ = EnumValue.objects.get_or_create(value=i)
                en_group.values.add(enum_value)
            attribute = Attribute.objects.create(name=data.get('name'), datatype=datatype, enum_group=en_group)
            BlockField.objects.create(block=block, attribute=attribute, datatype=data.get('data_type'), required=required, defaultvalue=defaultvalue, unique=unique, display=display,field_name_language=name_he)
            return Response({'data': "created"}, status=status.HTTP_201_CREATED)
        else:
            attr_check = Attribute.objects.filter(name=data.get('name').capitalize(), datatype=datatype).first()
            if not attr_check:
                attribute, created = Attribute.objects.get_or_create(name=data.get('name'), datatype=datatype)
                BlockField.objects.create(block=block, attribute=attribute, datatype=data.get('data_type'), required=required, defaultvalue=defaultvalue, unique=unique, display=display,field_name_language=name_he)
                return Response({'data': "created"}, status=status.HTTP_201_CREATED)
            return Response({'error': 'already exist'}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        data = self.request.data
        is_block = data.get('is_block')

        if is_block:
            # If it's a block update, call the update_block method
            return self.update_block(data)
        else:
            # If it's a field update, call the update_fields method
            return self.update_fields(data)

    def update_block(self, data):
        fields = data.get('fields', [])
        if not isinstance(fields, list):
            # If 'fields' is not a list, return a bad request response
            return Response({'error': 'Invalid data format'}, status=status.HTTP_400_BAD_REQUEST)
        # Fetch the Block object by ID
        for field_data in fields:
            block = Block.objects.filter(id=field_data.get('id')).first()
            if not block:
                # If the block doesn't exist, return a 404 Not Found response
                return Response({'error': 'Block not found'}, status=status.HTTP_404_NOT_FOUND)
            # Update the block's name and save it
            if field_data.get('name'):
                block.name = field_data.get('name')
            if field_data.get('display_order'):
                block.display_order = field_data.get('display_order')
            name_he = field_data.get('field_name_language')
            if name_he:
                block.field_name_language = name_he
            block.save()
            # Return a success response
        return Response({'data': 'Block updated'}, status=status.HTTP_200_OK)

    def update_fields(self, data):
        # Extract the 'fields' data from the request
        fields = data.get('fields', [])

        if not isinstance(fields, list):
            # If 'fields' is not a list, return a bad request response
            return Response({'error': 'Invalid data format'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for field_data in fields:
                # Call the update_field method for each field
                response = self.update_field(field_data)
                if response.status_code != status.HTTP_200_OK:
                    # If the update_field method returns an error, return that error response
                    return response
            # If all fields are updated successfully, return a success response
            return Response({'data': 'Fields updated'}, status=status.HTTP_200_OK)

    def update_field(self, field_data):
        # Fetch the BlockField object by ID
        obj = BlockField.objects.filter(id=field_data.get('id')).first()
        if not obj:
            # If the field doesn't exist, return a 404 Not Found response
            return Response({'error': 'Field not found'}, status=status.HTTP_404_NOT_FOUND)

        required = field_data.get('required')
        unique = field_data.get('unique')
        defaultvalue = field_data.get('defaultvalue')
        display = field_data.get('display')
        display_order = field_data.get('display_order')
        field_name = field_data.get('name')
        value = field_data.get('value')
        name_he = field_data.get('field_name_language')
        if name_he:
            obj.field_name_language = name_he

        if obj.unique and not unique and obj.is_editable:
            # If the field is unique but 'unique' is set to False, update 'unique' to False
            obj.unique = False

        if not obj.unique and unique and obj.is_editable:
            # If the field is not unique but 'unique' is set to True, update 'unique' to True and clear 'defaultvalue'
            obj.unique = True
            obj.defaultvalue = None

        if required is not None:
            # Update the 'required' attribute of the field if provided
            obj.required = required

        if defaultvalue is not None:
            # Update the 'defaultvalue' attribute of the field if provided
            obj.defaultvalue = defaultvalue


        if display is not None:
            # Update the 'display' attribute of the field if provided
            obj.display = display

        if display_order is not None:
            # Update the 'display_order' attribute of the field if provided
            obj.display_order = display_order
        if field_name and obj.is_editable:
            # Update the 'name' attribute of the related attribute if 'field_name' is provided
            obj.attribute.name = field_name
            obj.attribute.save()
        
        if obj.datatype == "select" and value:
            if not value:
                return Response({'error': 'Invalid data format'}, status=status.HTTP_400_BAD_REQUEST)
            values = value.split(',')
            # Get the existing EnumGroup associated with the attribute
            enum_group = obj.attribute.enum_group
            
            # Create a set of the values to make it easier to check for membership
            enum_value_set = set(values)
            for i in values:
                # Use get_or_create to ensure EnumValue objects exist
                enum_value, created = EnumValue.objects.get_or_create(value=i)
                # Add the EnumValue to the EnumGroup
                enum_group.values.add(enum_value)

            # Remove EnumValue objects from the EnumGroup that are not in the values list
            for enum_value in enum_group.values.all():
                if enum_value.value not in enum_value_set:
                    enum_group.values.remove(enum_value)
        obj.save()
        # Return a success response
        return Response({'data': 'Field updated'}, status=status.HTTP_200_OK)

    def delete_block(self,data):
        block = Block.objects.filter(id=data.get('id')).first()
        if not block:
            # If the block doesn't exist, return a 404 Not Found response
            return Response({'error': 'Block not found'}, status=status.HTTP_404_NOT_FOUND)
        if not block.is_delete:
            return Response({'error': "You can't delete this section"}, status=status.HTTP_404_NOT_FOUND)
        block.delete()
        return Response({'data': 'Block Deleted'}, status=status.HTTP_200_OK)

    def delete_field(self,data):
        field = BlockField.objects.filter(id=data.get('id')).first()
        if not field:
            # If the block doesn't exist, return a 404 Not Found response
            return Response({'error': 'Fields not found'}, status=status.HTTP_404_NOT_FOUND)
        if not field.is_delete:
            return Response({'error': "You can't delete this field"}, status=status.HTTP_406_NOT_ACCEPTABLE)
        field.delete()
        return Response({'data': 'Field Deleted'}, status=status.HTTP_200_OK)

    def delete(self, request):
        data = request.data
        is_block = data.get('is_block')

        if is_block:
            return self.delete_block(data)
        else:
            return self.delete_field(data)



class ClientsImportData(APIView):
    def post(self, request):

        data = request.data
        fields = data.get('clientsData', [])
        if not fields:
            return Response({'error': 'No data'}, status=status.HTTP_400_BAD_REQUEST)
        
        block_data = get_blocks()
        clients_to_create = []
        for field in fields:
            missing_keys = [key for key, value in block_data.items() if value['required'] and  not field.get(key)]
            client = Client()
            if missing_keys:
                return Response({'error': 'fields required'}, status=status.HTTP_400_BAD_REQUEST)
            for key,item in field.items():
                key_data = block_data.get(key)
                if not key_data:
                    return Response({"error": "Fields are invalid"}, status=status.HTTP_400_BAD_REQUEST)
                if key_data.get('required') and not key_data.get('defaultvalue'):
                    if not item:
                        return Response({"error": "Field is required"}, status=status.HTTP_400_BAD_REQUEST)
                if key_data.get('unique'):
                    dicts = {f'eav__{key}': item}
                    obj = Client.objects.filter(**dicts).first()
                    if obj:
                        return Response({"error": f"{key} is already exist"}, status=status.HTTP_400_BAD_REQUEST)
                if key_data.get('defaultvalue'):
                    item = item or key_data.get('defaultvalue')

                attr_name = key
                if key_data.get('data_type') == 'select':
                    item = EnumValue.objects.filter(id=item).first()  

                if key_data.get('data_type') == 'date':
                    item = datetime.datetime.strptime(item, "%Y-%m-%d")
                setattr(client.eav, attr_name, item)
            client.save()
            clients_to_create.append(client)
        return Response({'message': 'CSV file uploaded successfully'}, status=status.HTTP_201_CREATED)
