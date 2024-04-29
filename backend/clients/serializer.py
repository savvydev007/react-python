from clients.models import BlockField, Client, NetfreeUser,Block
from rest_framework import serializers


class NetfreeUserSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(max_length=100)
    email = serializers.CharField(max_length=200)
    class Meta:
        model = NetfreeUser
        fields = '__all__'
    def validate_user_id(self, value):
        if self.instance is None and NetfreeUser.objects.filter(user_id=value).exists():
            raise serializers.ValidationError(f"This Client with user id {str(value)} already in use.")
        if self.instance and self.instance.user_id != value and NetfreeUser.objects.filter(user_id=value).exists():
            raise serializers.ValidationError(f"This Client with user id {str(value)} already in use.")
        return value

    def validate_email(self, value):
        if self.instance is None and NetfreeUser.objects.filter(email=value).exists():
            raise serializers.ValidationError(f"This Client with email {str(value)} already in use.")
        if self.instance and self.instance.email != value and NetfreeUser.objects.filter(email=value).exists():
            raise serializers.ValidationError(f"This Client with email {str(value)} already in use.")
        return value
    

class ClientAttributeSerializer(serializers.ModelSerializer):
    required = serializers.SerializerMethodField()
    field_name = serializers.SerializerMethodField()
    field_slug = serializers.SerializerMethodField()
    data_type = serializers.SerializerMethodField()
    enum_values = serializers.SerializerMethodField()
    class Meta:
        model = BlockField
        fields = ['id','field_name','field_name_language','field_slug','data_type','enum_values','required','defaultvalue','unique','is_delete','is_editable','display_order','display']

    def get_field_name(self,obj):
        return obj.attribute.name
    def get_field_slug(self,obj):
        return obj.attribute.slug
    def get_required(self,obj):
        return obj.required
    def get_data_type(self,obj):
        return obj.datatype
    def get_enum_values(self, obj):
        if obj.attribute.datatype == "enum":
            values = obj.attribute.get_choices().values_list('id', 'value')
            result_dict = dict(values)
            result_list = [{"id":key,"value": value} for key, value in result_dict.items()]
            return {'choices': result_list}
        return {}
    
class ClientAttributeSerializerCustom(ClientAttributeSerializer):
    value = serializers.SerializerMethodField()
    class Meta:
        model = BlockField
        fields = ['id','field_name','field_slug','data_type','enum_values','required','defaultvalue','unique','is_delete','is_editable','display_order','display','value']
    def get_value(self,obj):
        return ''
    
    

def get_blocks():
    blocks = Block.objects.all()
    block_data = {}
    for block in blocks:
        block_info = BlockField.objects.filter(block=block).order_by('display_order')
        for block_field in block_info:
            client_data = ClientAttributeSerializerCustom(block_field).data
            block_data[client_data['field_slug']]=client_data
    return block_data
class ClientListSerializer(serializers.Serializer):
    client_id = serializers.IntegerField(source='id')
    blocks = serializers.SerializerMethodField()

    def get_blocks(self, client):
        blocks = Block.objects.all()
        block_data = []
        for block in blocks:
            block_info = BlockField.objects.filter(block=block).order_by('display_order')
            attr = []

            for block_field in block_info:
                client_data = ClientAttributeSerializerCustom(block_field).data
                attr.append(client_data)

            for client_eav in client.eav_values.all():
                for field in attr:
                    if field['field_name'] == client_eav.attribute.name:
                        if client_eav.attribute.datatype == 'enum':
                            field['value'] = [client_eav._get_value().id,client_eav._get_value().value]
                        else:
                            field['value'] = client_eav._get_value()

            block_data.append({
                'block_id': block.id,
                'block': block.name,
                'field_name_language': block.field_name_language,
                'field': attr,
            })

        return block_data