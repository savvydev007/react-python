from clients.models import Block, BlockField, NetfreeUser,Client
from clients.resources import NetfreeUserResource
from django.contrib import admin
from eav.admin import BaseEntityAdmin
from eav.forms import BaseDynamicEntityForm
from import_export import resources
# Register your models here.
from import_export.admin import ImportExportModelAdmin


class ClientAdminForm(BaseDynamicEntityForm):
    model = Client

class ClientAdmin(BaseEntityAdmin):
    form = ClientAdminForm

admin.site.register(Client, ClientAdmin)
admin.site.register(Block)
admin.site.register(BlockField)