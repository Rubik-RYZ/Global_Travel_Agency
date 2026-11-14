from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='cliente',
            name='carnet_public_id',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='carnet_url',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='pasaporte_public_id',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cliente',
            name='pasaporte_url',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='usuario',
            name='foto_public_id',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='usuario',
            name='foto_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
