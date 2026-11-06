"""Registro de modelos en el admin de Django."""
from django import forms
from django.contrib import admin

from apps.usuarios.models import (
    Auditoria,
    Cliente,
    ClientePreferencia,
    Rol,
    Usuario,
)


class UsuarioAdminForm(forms.ModelForm):
    """Formulario de admin con hashing de contraseña."""

    password = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        help_text="Dejar vacío para no cambiar la contraseña.",
        label="Contraseña",
    )

    class Meta:
        model = Usuario
        fields = "__all__"

    def save(self, commit=True):
        usuario = super().save(commit=False)
        nueva = self.cleaned_data.get("password")
        if nueva:
            usuario.set_password(nueva)
        if commit:
            usuario.save()
        return usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre")
    search_fields = ("nombre",)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    form = UsuarioAdminForm
    list_display = ("email", "rol", "activo", "creado_en", "last_login")
    list_filter = ("rol", "activo")
    search_fields = ("email",)
    ordering = ("email",)
    readonly_fields = ("creado_en", "last_login")


@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = ("creado_en", "accion", "usuario", "entidad", "ip")
    list_filter = ("accion",)
    search_fields = ("accion", "entidad", "entidad_id")
    date_hierarchy = "creado_en"
    readonly_fields = (
        "usuario",
        "accion",
        "entidad",
        "entidad_id",
        "detalle",
        "ip",
        "creado_en",
    )


class ClientePreferenciaInline(admin.StackedInline):
    model = ClientePreferencia
    extra = 0


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombres", "apellidos", "documento_numero", "pais_origen", "usuario")
    search_fields = ("nombres", "apellidos", "documento_numero")
    list_filter = ("documento_tipo", "pais_origen")
    inlines = [ClientePreferenciaInline]
