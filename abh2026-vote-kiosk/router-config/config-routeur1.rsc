# ======================================================================
# CONFIGURATION OFFICIELLE KIOSK ABH 2026 - ROUTEUR 1 (Principal)
# Candidat : Gildas ZODOME (BIO PHYTO - Bénin)
# ======================================================================

/system identity set name="MikroTik-Kiosk-1"
/system clock set time-zone-name=Africa/Porto-Novo

# Autoriser WinBox, API et Détection Neighbors sur le Port 1 (WAN)
/ip neighbor discovery-settings set discover-interface-list=all
/ip firewall filter remove [find where comment~="Allow WinBox"]
/ip firewall filter add chain=input in-interface=ether1 protocol=tcp dst-port=8291,8728 action=accept comment="Allow WinBox & API on WAN" place-before=0
/ip firewall filter add chain=input in-interface=ether1 protocol=udp dst-port=5678 action=accept comment="Allow WinBox & MNDP on WAN" place-before=0

# 1. WAN (Port 1 / ether1 : Réception Internet depuis la Box / 4G)
/ip dhcp-client remove [find interface=ether1]
/ip dhcp-client add interface=ether1 disabled=no comment="WAN: Box Internet / 4G"
/ip firewall nat remove [find where comment="NAT WAN Masquerade"]
/ip firewall nat add action=masquerade chain=srcnat out-interface=ether1 comment="NAT WAN Masquerade"

# 2. DNS Résolution & Nom du portail
/ip dns set allow-remote-requests=yes servers=8.8.8.8,1.1.1.1
/ip dns static remove [find where name="kiosk.vote"]
/ip dns static add name=kiosk.vote address=10.50.0.1 comment="Kiosk: DNS Portal"

# 3. Adressage IP & Serveur DHCP Hotspot (~700 adresses sur le Bridge)
/ip address remove [find interface=bridge]
/ip address add address=10.50.0.1/22 interface=bridge comment="Kiosk: Hotspot Subnet"
/ip pool remove [find name=kiosk-pool]
/ip pool add name=kiosk-pool ranges=10.50.1.10-10.50.3.250
/ip dhcp-server remove [find interface=bridge]
/ip dhcp-server add name=kiosk-dhcp interface=bridge address-pool=kiosk-pool lease-time=15m disabled=no
/ip dhcp-server network remove [find address="10.50.0.0/22"]
/ip dhcp-server network add address=10.50.0.0/22 gateway=10.50.0.1 dns-server=10.50.0.1 comment="Kiosk DHCP Network"

# 4. Wi-Fi Ouvert sans mot de passe (SSID Différencié Canal 1 / 2412 MHz)
/interface wireless security-profiles set [ find default=yes ] mode=none authentication-types=""
/interface wireless set [ find default-name=wlan1 ] disabled=no mode=ap-bridge ssid="VOTE ABH 2026 - GILDAS ZODOME 1" band=2ghz-b/g/n channel-width=20mhz frequency=2412 frequency-mode=manual-txpower country=no_country_set disable-running-check=yes installation=indoor

# 5. Profil & Serveur Hotspot (Authentification automatique MAC + HTTP-PAP)
/ip hotspot remove [find name=kiosk-hotspot]
/ip hotspot profile remove [find name=kiosk-profile]
/ip hotspot user profile remove [find name=kiosk-user-profile]
/ip hotspot user profile add name=kiosk-user-profile shared-users=1 rate-limit=2M/2M session-timeout=15m idle-timeout=3m keepalive-timeout=30s add-mac-cookie=no
/ip hotspot profile add name=kiosk-profile hotspot-address=10.50.0.1 dns-name=kiosk.vote html-directory=hotspot login-by=mac,http-pap mac-auth-password=""
/ip hotspot add name=kiosk-hotspot interface=bridge address-pool=kiosk-pool profile=kiosk-profile keepalive-timeout=30s idle-timeout=3m disabled=no
/ip hotspot user remove [find name=vote]
/ip hotspot user add name=vote password="" profile=kiosk-user-profile comment="Kiosk: Utilisateur universel de vote"

# 5.1 Auto-provisioning & Auto-login automatique des électeurs (Zéro Clic)
/system script remove [find name=kiosk_auto_user]
/system script add name=kiosk_auto_user comment="Auto-Provisioning Unique Voters" source=":do {\r\n  :foreach h in=[/ip hotspot host find authorized=no and bypassed=no] do={\r\n    :local hMac [/ip hotspot host get \$h mac-address]\r\n    :local hIp [/ip hotspot host get \$h address]\r\n    :if ([:len \$hMac] > 0) do={\r\n      :local isBanned [/ip firewall address-list find list=\"banned_students\" and address=\$hIp]\r\n      :if ([:len \$isBanned] = 0) do={\r\n        :if ([:len [/ip hotspot user find name=\$hMac]] = 0) do={\r\n          /ip hotspot user add name=\$hMac password=\"\" profile=\"kiosk-user-profile\" comment=(\"Auto-Voter: \" . \$hIp)\r\n        }\r\n      }\r\n    }\r\n  }\r\n} on-error={}"

/system scheduler remove [find name=sched_kiosk_auto_user]
/system scheduler add name=sched_kiosk_auto_user interval=2s on-event=kiosk_auto_user comment="Auto-Provisioning Scheduler"

# 6. MSS Clamping (PMTU pour éviter les blocages TLS Cloudflare)
/ip firewall mangle remove [find where comment~="Clamp MSS"]
/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn action=change-mss new-mss=clamp-to-pmtu comment="Clamp MSS to PMTU"

# 7. Walled Garden IP (HTTPS Port 443 + Protocoles E-mails de validation OTP + Cloudflare CIDRs)
/ip hotspot walled-garden ip remove [find where comment~="Kiosk"]

# --- Ports de synchronisation et notifications push mobiles ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google FCM Push 5228" dst-port=5228 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google FCM Push 5229" dst-port=5229 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google FCM Push 5230" dst-port=5230 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Apple APNs Push 5223" dst-port=5223 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: IMAPS 993" dst-port=993 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: POP3S 995" dst-port=995 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: SMTPS 587" dst-port=587 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: SMTPS SSL 465" dst-port=465 protocol=tcp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: DNS UDP 53" dst-port=53 protocol=udp
/ip hotspot walled-garden ip add action=accept comment="Kiosk: DNS TCP 53" dst-port=53 protocol=tcp

# --- Réseau Apple Push Notifications ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Apple Push CIDR" dst-address=17.0.0.0/8

# --- Plages IP Anycast officielles Cloudflare Turnstile ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 1" dst-address=104.16.0.0/12
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 2" dst-address=172.64.0.0/13
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 3" dst-address=162.158.0.0/15
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 4" dst-address=198.41.128.0/17
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 5" dst-address=173.245.48.0/20
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 6" dst-address=108.162.192.0/18
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 7" dst-address=190.93.240.0/20
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 8" dst-address=188.114.96.0/20
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 9" dst-address=141.101.64.0/18
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 10" dst-address=103.21.244.0/22
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 11" dst-address=103.22.200.0/22
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 12" dst-address=103.31.4.0/22
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 13" dst-address=197.234.240.0/22
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CIDR 14" dst-address=131.0.72.0/22

# --- Plateforme Officielle de Vote ABH 2026 & Cloudflare Turnstile ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Vote HTTPS" dst-host=*abh2026top10vote.org*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Vote API HTTPS" dst-host=*api.abh2026top10vote.org*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: ABH HTTPS" dst-host=*africabusinessheroes.org*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: ABH Event HTTPS" dst-host=*event.africabusinessheroes.org*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare Challenges" dst-host=*challenges.cloudflare.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare Insights" dst-host=*cloudflareinsights.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare Static" dst-host=*static.cloudflareinsights.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare CDN" dst-host=*cdnjs.cloudflare.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Cloudflare HTTPS" dst-host=*.cloudflare.com

# --- Écosystème Google / Gmail Complet (App Android, Play Services, Sync, OAuth) ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Mail HTTPS" dst-host=*mail.google.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Gmail Domain" dst-host=*gmail.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Accounts HTTPS" dst-host=*accounts.google.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Googleapis HTTPS" dst-host=*googleapis.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Static HTTPS" dst-host=*gstatic.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Main HTTPS" dst-host=*google.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google User Content" dst-host=*googleusercontent.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Cache GVT1" dst-host=*gvt1.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Android Clients" dst-host=*android.clients.google.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Google Mobile Talk" dst-host=*mtalk.google.com*

# --- Écosystème Microsoft Outlook / Hotmail / Office Complet (App Mobile, Substrate, Auth) ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Outlook Main" dst-host=*outlook.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Outlook Live HTTPS" dst-host=*outlook.live.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Outlook Office HTTPS" dst-host=*outlook.office.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Outlook 365" dst-host=*outlook.office365.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Outlook Substrate API" dst-host=*substrate.office.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Office Main" dst-host=*office.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Office 365" dst-host=*office365.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Microsoft Live" dst-host=*live.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Microsoft Main" dst-host=*microsoft.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Microsoft Online Auth" dst-host=*microsoftonline.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: MS Auth Net" dst-host=*msauth.net*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: MSFT Auth Net" dst-host=*msftauth.net*

# --- Écosystème Yahoo Mail Complet (App Mobile, API, Images) ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Yahoo Mail Main" dst-host=*yahoo.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Yahoo Images YIMG" dst-host=*yimg.com*

# --- Écosystème Apple Mail / iCloud Complet (App Mail iOS, CDN) ---
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Apple Mail iCloud" dst-host=*icloud.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Apple Main" dst-host=*apple.com*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: Apple Static MZ" dst-host=*mzstatic.com*

# 8. Shaper PCQ Équitable (512k down / 256k up par votant)
/queue simple remove [find name=Kiosk_R1_PCQ]
/queue type remove [find name=kiosk_pcq_down]
/queue type remove [find name=kiosk_pcq_up]
/queue type add name=kiosk_pcq_down kind=pcq pcq-rate=512k pcq-classifier=dst-address
/queue type add name=kiosk_pcq_up kind=pcq pcq-rate=256k pcq-classifier=src-address
/queue simple add name=Kiosk_R1_PCQ target=10.50.0.0/22 queue=kiosk_pcq_up/kiosk_pcq_down comment="Kiosk PCQ Shaper"

# 9. Bypass PC Superviseur
/ip hotspot ip-binding remove [find comment~="Kiosk Admin"]
/ip hotspot ip-binding add mac-address=A0:D3:C1:62:3D:79 type=bypassed comment="Kiosk Admin PC Bypassed"

# 10. Autorisation d'accès direct local (APK Android & EXE Desktop)
/ip service set api disabled=no port=8728
/ip service set www disabled=no port=80

# 11. Walled Garden pour le Serveur Cloud AlwaysData (Reverse Polling Kiosk)
/ip hotspot walled-garden ip add action=accept comment="Kiosk: AlwaysData Cloud" dst-host=*alwaysdata.net*
/ip hotspot walled-garden ip add action=accept comment="Kiosk: 2MC Domain" dst-host=*mcwifi.net*

# 12. Agent Reverse Polling Cloud AlwaysData (RouterOS v7)
/system script remove [find name=kiosk_polling_agent]
/system script add name=kiosk_polling_agent comment="Kiosk Polling Agent R1" source=":local serverUrl \"https://charmeldev.alwaysdata.net/api/poll?router=1\"\r\n:local resultUrl \"https://charmeldev.alwaysdata.net/api/poll/result?router=1\"\r\n:local authToken \"kiosk_poll_secret_2026\"\r\n\r\n:do {\r\n  :local fetchRes [/tool fetch url=\$serverUrl http-header-field=\"Authorization: Bearer \$authToken\" as-value output=user]\r\n  :if ((\$fetchRes->\"status\") = \"finished\" && [:typeof (\$fetchRes->\"data\")] = \"str\") do={\r\n    :local rawData (\$fetchRes->\"data\")\r\n    :local parsedData [:deserialize from=json value=\$rawData]\r\n    :local action (\$parsedData->\"action\")\r\n    :if (\$action = \"run\") do={\r\n      :local commandId (\$parsedData->\"id\")\r\n      :local cmdText (\$parsedData->\"command\")\r\n      :local cmdFunc [:parse \$cmdText]\r\n      :local outputData [\$cmdFunc]\r\n      :local resObj { \"id\"=\$commandId; \"status\"=\"done\"; \"output\"=\$outputData }\r\n      :local resJson [:serialize to=json value=\$resObj]\r\n      /tool fetch url=\$resultUrl http-method=post http-data=\$resJson http-header-field=\"Authorization: Bearer \$authToken\" http-header-field=\"Content-Type: application/json\" as-value output=user\r\n    }\r\n  }\r\n} on-error={}"

/system scheduler remove [find name=sched_kiosk_poll]
/system scheduler add name=sched_kiosk_poll interval=2s on-event=kiosk_polling_agent comment="Kiosk Polling Scheduler R1"

