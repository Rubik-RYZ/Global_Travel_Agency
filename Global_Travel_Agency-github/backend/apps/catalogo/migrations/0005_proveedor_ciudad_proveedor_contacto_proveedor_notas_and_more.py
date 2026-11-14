from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0004_destino_lema'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='ciudad',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='contacto',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='notas',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='proveedor',
            name='pais',
            field=models.TextField(blank=True, null=True),
        ),
    ]
