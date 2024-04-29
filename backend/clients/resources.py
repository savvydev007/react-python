# resources.py
from import_export import fields, resources

from .models import NetfreeUser


class NetfreeUserResource(resources.ModelResource):
    class Meta:
        model = NetfreeUser

class NetfreeUserExportResource(resources.ModelResource):
    netfree_profile = fields.Field(column_name='netfree_profile')

    class Meta:
        model = NetfreeUser
        fields = ('id','user_id', 'email', 'name', 'full_name', 'first_name', 'last_name', 'netfree_profile','phone', 'sector')

    def dehydrate_netfree_profile(self, netfree_user):
        return netfree_user.netfree_profile.name if netfree_user.netfree_profile else ""
    

class NetfreeUserImportResource(resources.ModelResource):
    class Meta:
        model = NetfreeUser
        fields = ('user_id', 'email', 'name', 'full_name', 'first_name', 'last_name','phone', 'sector')