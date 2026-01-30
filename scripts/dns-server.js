const dns2 = require('dns2');
const { Packet } = dns2;

// DNS kayıtları - buraya istediğiniz domain'leri ekleyebilirsiniz
const RECORDS = {
    'tsc.local': '10.166.1.23',
    'ticket.local': '10.166.1.23',
    'destek.local': '10.166.1.23'
};

// Üst DNS sunucusu (çözülemeyen sorgular için)
const UPSTREAM_DNS = '8.8.8.8';

const server = dns2.createServer({
    udp: true,
    handle: async (request, send, rinfo) => {
        const response = Packet.createResponseFromRequest(request);
        const [question] = request.questions;
        const { name, type } = question;

        console.log(`[DNS] Sorgu: ${name} (Tip: ${type})`);

        // Yerel kayıtlarda var mı kontrol et
        if (RECORDS[name.toLowerCase()]) {
            response.answers.push({
                name,
                type: Packet.TYPE.A,
                class: Packet.CLASS.IN,
                ttl: 300,
                address: RECORDS[name.toLowerCase()]
            });
            console.log(`[DNS] Yerel çözüm: ${name} -> ${RECORDS[name.toLowerCase()]}`);
        } else {
            // Üst DNS'e yönlendir
            try {
                const resolver = new dns2({ dns: UPSTREAM_DNS });
                const result = await resolver.resolveA(name);
                if (result.answers) {
                    response.answers = result.answers;
                }
                console.log(`[DNS] Upstream çözüm: ${name}`);
            } catch (err) {
                console.log(`[DNS] Çözülemedi: ${name}`);
            }
        }

        send(response);
    }
});

server.on('listening', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           TSC Lokal DNS Sunucusu Başlatıldı!               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  Port: 53 (UDP)                                            ║');
    console.log('║                                                            ║');
    console.log('║  Kayıtlı Domain\'ler:                                       ║');
    Object.entries(RECORDS).forEach(([domain, ip]) => {
        console.log(`║    ${domain.padEnd(20)} -> ${ip.padEnd(15)}        ║`);
    });
    console.log('║                                                            ║');
    console.log('║  Kullanım:                                                 ║');
    console.log('║    1. Cihazınızın DNS\'ini 10.166.1.23 yapın               ║');
    console.log('║    2. Tarayıcıda http://tsc.local:3000 açın               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
});

server.on('requestError', (err) => {
    console.error('[DNS Hata]', err);
});

server.on('close', () => {
    console.log('[DNS] Sunucu kapatıldı');
});

// Port 53'te dinle
server.listen({
    udp: 53
});

console.log('[DNS] Sunucu başlatılıyor...');
