# Eradication Verification Checklist

Use this checklist after executing the eradication procedures.

## WS01

- [x] `Atomic Red Team` Registry Run-key value removed
- [x] Scheduled task `spawn` removed
- [x] `C:\Users\Public\splunkd.exe` removed
- [x] `%TEMP%\T1119_*.txt` collection staging files removed

## WS02

- [x] WMI Filter-to-Consumer Binding removed
- [x] WMI CommandLineEventConsumer removed
- [x] WMI Event Filter removed
- [x] `C:\Users\Public\splunkd.exe` removed

## DC01

- [x] `%TEMP%\mimikatz` removed
- [x] `C:\Users\Public\splunkd.exe` removed

## Verification Commands

### Registry

```powershell
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
```

### Scheduled Task

```powershell
Get-ScheduledTask -TaskName "spawn" -ErrorAction SilentlyContinue
```

### WMI

```powershell
Get-CimInstance -Namespace root/subscription -ClassName __EventFilter
```

### Mimikatz

```powershell
Test-Path "$env:TEMP\mimikatz"
```

Expected:

```text
False
```

### CALDERA Agent

```powershell
Test-Path "C:\Users\Public\splunkd.exe"
```

Expected:

```text
False
```

### Collection Files

```powershell
Get-ChildItem "$env:TEMP" -Filter "T1119_*"
```

No matching files should be returned.

## Result

All documented adversary artifacts were checked for removal before the recovery phase.
