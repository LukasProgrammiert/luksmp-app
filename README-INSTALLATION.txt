LukSMP App v25 – Windows-Installer

WAS DIESE VERSION MACHT
- Fügt der Website einen direkten Windows-App-Download-Link hinzu.
- Enthält eine Electron-Desktop-App, die LukSMP in einem eigenen Fenster öffnet.
- GitHub Actions baut den Windows-Installer und veröffentlicht ihn als Release-Datei.
- Installer erstellt Desktop- und Startmenü-Verknüpfungen.

WICHTIG: Der EXE-Installer ist nicht bereits in diesem ZIP enthalten. Er wird von GitHub Actions auf einem Windows-Runner gebaut, nachdem die Dateien ins Repository übernommen und committed wurden.

INSTALLATION / VERÖFFENTLICHUNG
1. ZIP entpacken.
2. Alle Dateien und Ordner aus LukSMP-App_v25 in das Hauptverzeichnis des Repositorys LukasProgrammiert/luksmp-app hochladen. Bestehende Dateien ersetzen; den Ordner .github samt workflows/windows-installer.yml und den Ordner desktop mit hochladen.
3. Commit changes auf dem Branch main.
4. Auf GitHub das Repository öffnen und Actions auswählen.
5. Workflow "Build LukSMP Windows Installer" öffnen und warten, bis der Lauf grün ist.
6. Der direkte Installer-Link lautet:
   https://github.com/LukasProgrammiert/luksmp-app/releases/latest/download/LukSMP-Setup.exe

Danach löst der Button auf der LukSMP-App-Startseite den Datei-Download aus, anstatt die Website als Ziel zu öffnen.

Hinweise
- Der Installer wird erst verfügbar, wenn der GitHub-Actions-Lauf erfolgreich ist.
- Der Installer ist für Windows x64.
- Die App benötigt Internetzugang, weil sie die bestehende LukSMP-Web-App lädt.
- Der Download ist nicht code-signiert, daher kann Windows SmartScreen beim ersten Start warnen.
- Es wurde hier kein Windows-EXE-Build ausgeführt; die Erstellung erfolgt durch GitHub Actions.
