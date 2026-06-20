from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_otaupdatebundle_is_testing_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='otaupdatebundle',
            name='zip_data',
        ),
    ]
