#!/bin/bash
proxies=(
"142.111.48.253:7030:cxayxlbh:6ktwcpi37mgj"
"23.95.150.145:6114:cxayxlbh:6ktwcpi37mgj"
"45.38.107.97:6014:cxayxlbh:6ktwcpi37mgj"
"198.23.243.226:6361:cxayxlbh:6ktwcpi37mgj"
"84.247.60.125:6095:cxayxlbh:6ktwcpi37mgj"
"104.239.107.47:5699:cxayxlbh:6ktwcpi37mgj"
"23.27.208.120:5830:cxayxlbh:6ktwcpi37mgj"
"23.229.19.94:8689:cxayxlbh:6ktwcpi37mgj"
"2.57.20.2:6983:cxayxlbh:6ktwcpi37mgj"
"198.154.89.151:6242:cxayxlbh:6ktwcpi37mgj"
)

for p in "${proxies[@]}"; do
    ip=$(echo $p | cut -d: -f1)
    port=$(echo $p | cut -d: -f2)
    user=$(echo $p | cut -d: -f3)
    pass=$(echo $p | cut -d: -f4)
    echo -n "Testing $ip:$port ... "
    code=$(curl -m 5 -s -o /dev/null -w "%{http_code}" -x "http://$user:$pass@$ip:$port" https://api.steampowered.com/)
    if [ "$code" == "404" ] || [ "$code" == "200" ]; then
        echo "✅ OK ($code)"
    else
        echo "❌ FAIL ($code)"
    fi
done
