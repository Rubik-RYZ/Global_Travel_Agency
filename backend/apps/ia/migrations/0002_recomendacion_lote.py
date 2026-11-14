from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('ia', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='recomendacion',
            name='lote',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False),
        ),
    ]
