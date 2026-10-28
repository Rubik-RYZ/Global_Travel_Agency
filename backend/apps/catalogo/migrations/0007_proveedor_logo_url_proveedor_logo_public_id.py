from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0006_destino_imagen_public_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='logo_url',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='logo_public_id',
            field=models.TextField(blank=True, null=True),
        ),
    ]
