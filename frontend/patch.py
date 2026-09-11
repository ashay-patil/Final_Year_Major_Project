import sys

with open('src/pages/MainApp.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Add imports after the last import
    if i == 16:
        new_lines.append(line)
        new_lines.append("import CommandCenter from './CommandCenter';\n")
        new_lines.append("import Patient360 from './Patient360';\n")
        new_lines.append("import AIActivityCenter from './AIActivityCenter';\n")
        continue
    
    # Remove old apiService
    if line.startswith("const API_BASE_URL = 'http://localhost:8000';"):
        skip = True
        new_lines.append("import apiService from '../services/api';\n")
        continue
    if skip and line.startswith("// Toast Context"):
        skip = False
    if skip:
        continue

    # Add selectedPatientId
    if "const [chatbotOpen, setChatbotOpen] = useState(false);" in line:
        new_lines.append(line)
        new_lines.append("  const [selectedPatientId, setSelectedPatientId] = useState(null);\n")
        continue

    # Add switch cases
    if "case 'insurance': return <InsurancePortal />;" in line:
        new_lines.append(line)
        new_lines.append("      case 'command': return <CommandCenter onNavigateToPatient={(id) => { setSelectedPatientId(id); setCurrentView('patient360'); }} />;\n")
        new_lines.append("      case 'patient360': return <Patient360 patientId={selectedPatientId} onBack={() => setCurrentView('command')} />;\n")
        new_lines.append("      case 'aiactivity': return <AIActivityCenter onNavigateToPatient={(id) => { setSelectedPatientId(id); setCurrentView('patient360'); }} />;\n")
        continue

    # Add to sidebar
    if "{ label: 'Chest X-Ray AI', value: 'xray', icon: ScanLine }" in line:
        new_lines.append(line.replace('}', '},'))
        new_lines.append("                { label: 'Command Center', value: 'command', icon: Activity, color: 'text-emerald-400' },\n")
        new_lines.append("                { label: 'AI Activity Center', value: 'aiactivity', icon: Brain, color: 'text-purple-400' }\n")
        continue
        
    new_lines.append(line)

with open('src/pages/MainApp.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Success')
