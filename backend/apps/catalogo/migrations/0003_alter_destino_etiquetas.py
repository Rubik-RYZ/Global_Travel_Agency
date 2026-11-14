import django.contrib.postgres.fields
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0002_itinerariodia_destino_caracter_destino_destacado_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='destino',
            name='etiquetas',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), blank=True, default=list, size=None),
        ),
    ]
