import os

path = r'c:\Users\chahd\MesProjets\mon-frontend (2)\mon-frontend\public\assets\i18n\en.json'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix the broken line 693 (0-indexed 692)
# Current: 692:       "BTN_CREATE"  "SUPER_ADMIN": {
# New:     692:       "BTN_CREATE": "Create account"
# and we need to add the closing braces for FORM and COLLABORATEURS
new_lines = lines[:692]
new_lines.append('      "BTN_CREATE": "Create account"\n')
new_lines.append('    }\n')
new_lines.append('  },\n')
new_lines.append('  "SUPER_ADMIN": {\n')
# Now append the rest starting from line 694 (0-indexed 693)
# BUT wait, line 694 was "DASHBOARD": {
new_lines.extend(lines[693:])

# Now we need to truncate the extra braces at the end.
# SUPER_ADMIN structure:
# DASSBOARD (ends at 703? No, lines shifted)
# ...
# USERS: {
#   FORM: {
#     ACTIONS: {
#       CANCEL: ...
#       CREATE: ...
#       SAVE: ...
#       NEW: ...
#     }
#   }
# }
# } (SUPER_ADMIN)
# } (ROOT)

# I'll just find the first occurrence of "NEW": "Create" and then add the necessary closing braces.
found = -1
for i, line in enumerate(new_lines):
    if '"NEW": "Create"' in line:
        found = i
        break

if found != -1:
    final_lines = new_lines[:found+1]
    final_lines.append('          }\n') # closes ACTIONS
    final_lines.append('        }\n')   # closes FORM
    final_lines.append('      }\n')     # closes USERS
    final_lines.append('  }\n')         # closes SUPER_ADMIN
    final_lines.append('}\n')           # closes Root
    
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("en.json fixed successfully.")
else:
    print("Could not find 'NEW': 'Create' in en.json")
