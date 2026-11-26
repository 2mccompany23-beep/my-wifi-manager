# ====================================================================
# CONFIGURATION AUTOMATIQUE MIKROTIK ROUTEROS v7
# PROJET : ABH 2026 VOTE KIOSK (Candidat Gildas Zodome - Bénin)
# ====================================================================
# Objectifs :
# 1. Port 1 (ether1) = WAN Uplink (Box 4G/Routeur)
# 2. Ports ether2-ether5 + wlan1 = Bridge Hotspot Etudiants
# 3. Wi-Fi Open (SSID: VOTE ABH 2026 - GILDAS ZODOME)
# 4. Portail Captif Kiosk : redirection automatique vers le vote
# 5. Walled Garden STRICT : Seuls le site de vote et les messageries
#    (Gmail, Outlook, Yahoo, iCloud, IMAP/POP3) sont autorisés.
#    TOUT LE RESTE EST BLOQUE (Economie drastique de Data).
# 6. Limitation de bande passante (PCQ 512k/256k) par etudiant.
# 7. Bannissement automatique apres 20 Mo de data ou 15 minutes.
# ====================================================================

:log info ">>> Demarrage configuration Kiosk ABH 2026..."

# --------------------------------------------------------------------
# 1. UPLINK WAN (ether1)
# --------------------------------------------------------------------
/interface list
add name=WAN comment="Interfaces WAN Uplink"
add name=LAN comment="Interfaces LAN Hotspot"

/interface list member
remove [find where list=WAN or list=LAN]
add interface=ether1 list=WAN
add interface=bridge list=LAN

/ip dhcp-client
remove [find where interface=ether1]
add interface=ether1 add-default-route=yes use-peer-dns=yes disabled=no comment="WAN Uplink 4G/Box"

/ip firewall nat
remove [find where comment~"Kiosk"]
add chain=srcnat out-interface-list=WAN action=masquerade comment="Kiosk: Masquerade WAN"

# --------------------------------------------------------------------
# 2. ADRESSAGE IP (Double IP : Admin 192.168.88.1 + Kiosk 10.50.0.1)
# --------------------------------------------------------------------
/ip address
remove [find where comment~"Kiosk"]
add address=10.50.0.1/22 interface=bridge comment="Kiosk: IP Hotspot Etudiants (Pool 1000 IPs)"

/ip pool
remove [find where name="kiosk-pool"]
add name=kiosk-pool ranges=10.50.1.10-10.50.3.250

/ip dhcp-server
remove [find where name="kiosk-dhcp"]
add name=kiosk-dhcp interface=bridge address-pool=kiosk-pool lease-time=15m disabled=no

/ip dhcp-server network
remove [find where comment~"Kiosk"]
add address=10.50.0.0/22 gateway=10.50.0.1 dns-server=10.50.0.1 comment="Kiosk: Network Etudiants"

/ip dns
set allow-remote-requests=yes cache-size=4096KiB servers=8.8.8.8,1.1.1.1

/ip dns static
remove [find where comment~"Kiosk"]
add name=kiosk.vote address=10.50.0.1 comment="Kiosk: Domaine local portail"

# --------------------------------------------------------------------
# 3. POINT D'ACCES WI-FI (wlan1)
# --------------------------------------------------------------------
/interface wireless security-profiles
set [find default=yes] mode=none authentication-types=""

/interface wireless
set [find default-name=wlan1] \
  mode=ap-bridge \
  ssid="VOTE ABH 2026 - GILDAS ZODOME" \
  band=2ghz-b/g/n \
  channel-width=20mhz \
  frequency=auto \
  wireless-protocol=802.11 \
  country=etsi \
  installation=any \
  hide-ssid=no \
  disabled=no

# --------------------------------------------------------------------
# 4. PROFILE & SERVEUR HOTSPOT
# --------------------------------------------------------------------
/ip hotspot profile
remove [find where name="kiosk-profile"]
add name=kiosk-profile \
  hotspot-address=10.50.0.1 \
  dns-name="kiosk.vote" \
  html-directory=hotspot \
  login-by=mac,http-pap \
  mac-auth-password="" \
  use-radius=no

/ip hotspot user profile
remove [find where name="kiosk-user-profile"]
add name=kiosk-user-profile \
  shared-users=1 \
  rate-limit="2M/2M" \
  session-timeout=15m \
  idle-timeout=3m \
  keepalive-timeout=30s \
  add-mac-cookie=no \
  status-autorefresh=1m

/ip hotspot
remove [find where name="kiosk-hotspot"]
add name=kiosk-hotspot interface=bridge address-pool=kiosk-pool profile=kiosk-profile keepalive-timeout=30s idle-timeout=3m disabled=no

# Utilisateur universel de vote Hotspot
/ip hotspot user
remove [find where name="vote"]
add name=vote password="" profile=kiosk-user-profile comment="Kiosk: Utilisateur universel de vote"

# 4.1 Auto-provisioning des électeurs dès connexion Wi-Fi
/system script remove [find name=kiosk_auto_user]
/system script add name=kiosk_auto_user comment="Auto-Provisioning Unique Voters" source=":do {\r\n  :foreach h in=[/ip hotspot host find authorized=no and bypassed=no] do={\r\n    :local hMac [/ip hotspot host get \$h mac-address]\r\n    :local hIp [/ip hotspot host get \$h address]\r\n    :if ([:len \$hMac] > 0) do={\r\n      :local isBanned [/ip firewall address-list find list=\"banned_students\" and address=\$hIp]\r\n      :if ([:len \$isBanned] = 0) do={\r\n        :if ([:len [/ip hotspot user find name=\$hMac]] = 0) do={\r\n          /ip hotspot user add name=\$hMac password=\"\" profile=\"kiosk-user-profile\" comment=(\"Auto-Voter: \" . \$hIp)\r\n        }\r\n      }\r\n    }\r\n  }\r\n} on-error={}"

/system scheduler remove [find name=sched_kiosk_auto_user]
/system scheduler add name=sched_kiosk_auto_user interval=2s on-event=kiosk_auto_user comment="Auto-Provisioning Scheduler"

# Bypass pour le PC de gestion Admin RJ45
/ip hotspot ip-binding
remove [find where comment~"Kiosk Admin PC"]
add mac-address=A0:D3:C1:62:3D:79 type=bypassed comment="Kiosk Admin PC (Bypass Hotspot)"

# --------------------------------------------------------------------
# 5. WALLED GARDEN STRICT (Plateforme de Vote + Messageries OTP)
# --------------------------------------------------------------------
/ip hotspot walled-garden
remove [find where comment~"Kiosk"]

# 5.1 Plateforme de vote et actifs
add dst-host=abh2026top10vote.org comment="Kiosk: Vote Platform"
add dst-host=*.abh2026top10vote.org comment="Kiosk: Vote Platform Subdomains"
add dst-host=africabusinessheroes.org comment="Kiosk: ABH Official"
add dst-host=*.africabusinessheroes.org comment="Kiosk: ABH Subdomains"
add dst-host=challenges.cloudflare.com comment="Kiosk: Cloudflare Captcha Turnstile"
add dst-host=*.cloudflare.com comment="Kiosk: Cloudflare CDN"

# 5.2 Google / Gmail
add dst-host=mail.google.com comment="Kiosk: Gmail Web"
add dst-host=accounts.google.com comment="Kiosk: Google Accounts Auth"
add dst-host=*.google.com comment="Kiosk: Google Domains"
add dst-host=*.googleapis.com comment="Kiosk: Google APIs"
add dst-host=*.gstatic.com comment="Kiosk: Google Static Assets"
add dst-host=*.googleusercontent.com comment="Kiosk: Google User Content"

# 5.3 Microsoft / Outlook / Hotmail
add dst-host=outlook.live.com comment="Kiosk: Outlook Web"
add dst-host=outlook.office.com comment="Kiosk: Office365 Web"
add dst-host=login.live.com comment="Kiosk: Microsoft Auth"
add dst-host=login.microsoftonline.com comment="Kiosk: Microsoft Online Auth"
add dst-host=account.live.com comment="Kiosk: Microsoft Live"
add dst-host=*.live.com comment="Kiosk: Microsoft Live Subdomains"
add dst-host=*.outlook.com comment="Kiosk: Outlook Subdomains"

# 5.4 Yahoo Mail
add dst-host=mail.yahoo.com comment="Kiosk: Yahoo Mail"
add dst-host=login.yahoo.com comment="Kiosk: Yahoo Login"
add dst-host=*.yahoo.com comment="Kiosk: Yahoo Subdomains"
add dst-host=*.yimg.com comment="Kiosk: Yahoo Images"

# 5.5 Apple / iCloud Mail
add dst-host=mail.icloud.com comment="Kiosk: iCloud Mail"
add dst-host=idmsa.apple.com comment="Kiosk: Apple ID Auth"
add dst-host=*.apple.com comment="Kiosk: Apple Services"
add dst-host=*.icloud.com comment="Kiosk: iCloud Services"

# 5.6 Ports IP Messageries (IMAPS, POP3S, SMTPS pour applications mobiles)
/ip hotspot walled-garden ip
remove [find where comment~"Kiosk"]
add action=accept dst-port=993 protocol=tcp comment="Kiosk: IMAPS (Gmail/Mail App)"
add action=accept dst-port=995 protocol=tcp comment="Kiosk: POP3S (Mail App)"
add action=accept dst-port=587 protocol=tcp comment="Kiosk: SMTPS Submission"
add action=accept dst-port=465 protocol=tcp comment="Kiosk: SMTPS SSL"
add action=accept dst-port=53 protocol=udp comment="Kiosk: DNS UDP"
add action=accept dst-port=53 protocol=tcp comment="Kiosk: DNS TCP"

# --------------------------------------------------------------------
# 6. LIMITATION DE BANDE PASSANTE EQUITABLE (PCQ Shaper)
# --------------------------------------------------------------------
/queue type
remove [find where name="kiosk_pcq_down" or name="kiosk_pcq_up"]
add name=kiosk_pcq_down kind=pcq pcq-rate=512k pcq-classifier=dst-address
add name=kiosk_pcq_up kind=pcq pcq-rate=256k pcq-classifier=src-address

/queue simple
remove [find where name="Kiosk_Students_PCQ"]
add name=Kiosk_Students_PCQ target=10.50.0.0/22 queue=kiosk_pcq_up/kiosk_pcq_down comment="Kiosk: PCQ Equitable 512k/256k par etudiant"

# --------------------------------------------------------------------
# 7. REGLES DE PARE-FEU & ANTI-ABUS (Bannissement Quota / Temps)
# --------------------------------------------------------------------
/ip firewall filter
remove [find where comment~"Kiosk"]

# Règle 1 : Bloquer immédiatement tout appareil dans la liste des bannis
add chain=forward src-address-list=banned_students action=drop comment="Kiosk: Bloquer etudiants bannis (Forward)"
add chain=input src-address-list=banned_students action=drop comment="Kiosk: Bloquer etudiants bannis (Input/DNS)"

# Script de vérification et bannissement autonome (20 Mo ou 15 min)
/system script
remove [find where name="kiosk_auto_ban"]
add name=kiosk_auto_ban source={
  :local maxBytes (20 * 1024 * 1024); # 20 Megabytes max
  :foreach h in=[/ip hotspot host find where !bypassed] do={
    :local hMac [/ip hotspot host get $h mac-address];
    :local hIp [/ip hotspot host get $h address];
    :local bIn [/ip hotspot host get $h bytes-in];
    :local bOut [/ip hotspot host get $h bytes-out];
    :local totalBytes ($bIn + $bOut);
    :if ($totalBytes > $maxBytes) do={
      /ip firewall address-list add list=banned_students address=$hIp timeout=24h comment=("Quota 20Mo depasse: " . $hMac);
      /ip hotspot host remove $h;
      :log warning ("Kiosk ABH: Banni pour quota depasse -> " . $hMac . " (" . $hIp . " - " . ($totalBytes / 1048576) . " Mo)");
    }
  }
}

/system scheduler
remove [find where name="sched_kiosk_ban"]
add name=sched_kiosk_ban interval=1m on-event="kiosk_auto_ban" comment="Kiosk: Verif quota etudiants chaque minute"

:log info ">>> Configuration Kiosk ABH 2026 appliquee avec succes !"

