import json

def check_json(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            json.load(f)
        print(f"{filename} is valid.")
    except Exception as e:
        print(f"{filename} is INVALID: {e}")

check_json(r'c:\Users\chahd\MesProjets\mon-frontend (2)\mon-frontend\public\assets\i18n\fr.json')
check_json(r'c:\Users\chahd\MesProjets\mon-frontend (2)\mon-frontend\public\assets\i18n\en.json')
