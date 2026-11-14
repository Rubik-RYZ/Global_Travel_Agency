from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('catalogo', '0003_alter_destino_etiquetas'),
    ]

    operations = [
        migrations.AddField(
            model_name='destino',
            name='lema',
            field=models.TextField(blank=True, null=True),
        ),
    ]
