from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0005_proveedor_ciudad_proveedor_contacto_proveedor_notas_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='destino',
            name='imagen_public_id',
            field=models.TextField(blank=True, null=True),
        ),
    ]
