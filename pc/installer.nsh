; GESCOUNT - réglages de l'installateur (NSIS)
; Les données sont dans %APPDATA%\GESCOUNT\donnees : elles ne sont jamais effacées,
; ni par une réinstallation par-dessus, ni par la désinstallation.

!macro customHeader
  ShowInstDetails show
!macroend

!macro customInstall
  DetailPrint "Vos données GESCOUNT restent dans $APPDATA\GESCOUNT\donnees"
  ; Raccourcis avec l'icône GESCOUNT (l'exe lui-même garde l'icône par défaut, comme GESTIME)
  CreateShortCut "$DESKTOP\GESCOUNT.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\gescount-icone.ico" 0
  CreateDirectory "$SMPROGRAMS"
  CreateShortCut "$SMPROGRAMS\GESCOUNT.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\gescount-icone.ico" 0
!macroend

!macro customUnInstall
  DetailPrint "Les données de $APPDATA\GESCOUNT\donnees sont conservées."
!macroend
