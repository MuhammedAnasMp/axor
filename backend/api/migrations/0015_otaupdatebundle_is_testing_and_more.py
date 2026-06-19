from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_otaupdatebundle'),
    ]

    operations = [
        migrations.AddField(
            model_name='otaupdatebundle',
            name='is_testing',
            field=models.BooleanField(default=True, help_text='If true, this update is only visible to registered test devices'),
        ),
        migrations.AddField(
            model_name='otaupdatebundle',
            name='zip_data',
            field=models.BinaryField(blank=True, help_text='Binary contents of the ZIP file stored in the database for Render persistent serving', null=True),
        ),
    ]
