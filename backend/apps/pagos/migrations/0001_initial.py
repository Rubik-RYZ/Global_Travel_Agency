from decimal import Decimal
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('reservas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pago',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('monto', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('moneda', models.CharField(choices=[('BOB', 'Boliviano'), ('USD', 'Dólar'), ('EUR', 'Euro')], max_length=3)),
                ('tipo_cambio_a_bob', models.DecimalField(decimal_places=6, default=Decimal('1'), max_digits=14)),
                ('monto_bob', models.DecimalField(decimal_places=2, max_digits=14)),
                ('metodo', models.TextField(default='tarjeta')),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('aprobado', 'Aprobado'), ('fallido', 'Fallido'), ('reembolsado', 'Reembolsado')], default='pendiente', max_length=20)),
                ('stripe_payment_id', models.TextField(blank=True, null=True, unique=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'pagos',
            },
        ),
        migrations.CreateModel(
            name='TipoCambio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField()),
                ('moneda_origen', models.CharField(choices=[('BOB', 'Boliviano'), ('USD', 'Dólar'), ('EUR', 'Euro')], max_length=3)),
                ('moneda_destino', models.CharField(choices=[('BOB', 'Boliviano'), ('USD', 'Dólar'), ('EUR', 'Euro')], max_length=3)),
                ('tasa', models.DecimalField(decimal_places=6, max_digits=14)),
            ],
            options={
                'db_table': 'tipos_cambio',
            },
        ),
        migrations.AddConstraint(
            model_name='tipocambio',
            constraint=models.UniqueConstraint(fields=('fecha', 'moneda_origen', 'moneda_destino'), name='ux_tipos_cambio_fecha_par'),
        ),
        migrations.AddConstraint(
            model_name='tipocambio',
            constraint=models.CheckConstraint(check=models.Q(('tasa__gt', 0)), name='ck_tipos_cambio_tasa_pos'),
        ),
        migrations.AddField(
            model_name='pago',
            name='reserva',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pagos', to='reservas.reserva'),
        ),
        migrations.AddIndex(
            model_name='pago',
            index=models.Index(fields=['reserva'], name='ix_pagos_reserva'),
        ),
        migrations.AddConstraint(
            model_name='pago',
            constraint=models.CheckConstraint(check=models.Q(('monto__gt', 0)), name='ck_pagos_monto_pos'),
        ),
        migrations.AddConstraint(
            model_name='pago',
            constraint=models.CheckConstraint(check=models.Q(('monto_bob__gt', 0)), name='ck_pagos_monto_bob_pos'),
        ),
        migrations.AddConstraint(
            model_name='pago',
            constraint=models.CheckConstraint(check=models.Q(('tipo_cambio_a_bob__gt', 0)), name='ck_pagos_tc_pos'),
        ),
    ]
