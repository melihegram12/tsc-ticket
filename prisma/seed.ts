import { PrismaClient, TicketPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // =============================================
  // PERMISSIONS
  // =============================================
  const permissionData = [
    // Ticket permissions
    { key: 'ticket.create', name: 'Ticket Oluştur', category: 'ticket' },
    { key: 'ticket.read', name: 'Ticket Görüntüle', category: 'ticket' },
    { key: 'ticket.read.all', name: 'Tüm Ticketları Görüntüle', category: 'ticket' },
    { key: 'ticket.read.department', name: 'Departman Ticketlarını Görüntüle', category: 'ticket' },
    { key: 'ticket.update', name: 'Ticket Güncelle', category: 'ticket' },
    { key: 'ticket.delete', name: 'Ticket Sil', category: 'ticket' },
    { key: 'ticket.assign', name: 'Ticket Ata', category: 'ticket' },
    { key: 'ticket.internal_note', name: 'İç Not Ekle', category: 'ticket' },

    // KB permissions
    { key: 'kb.read', name: 'Bilgi Bankası Oku', category: 'kb' },
    { key: 'kb.create', name: 'Makale Oluştur', category: 'kb' },
    { key: 'kb.update', name: 'Makale Güncelle', category: 'kb' },
    { key: 'kb.delete', name: 'Makale Sil', category: 'kb' },

    // Admin permissions
    { key: 'admin.users', name: 'Kullanıcı Yönetimi', category: 'admin' },
    { key: 'admin.departments', name: 'Departman Yönetimi', category: 'admin' },
    { key: 'admin.categories', name: 'Kategori Yönetimi', category: 'admin' },
    { key: 'admin.sla', name: 'SLA Yönetimi', category: 'admin' },
    { key: 'admin.automation', name: 'Otomasyon Yönetimi', category: 'admin' },
    { key: 'admin.settings', name: 'Sistem Ayarları', category: 'admin' },
    { key: 'admin.email', name: 'E-posta Ayarları', category: 'admin' },

    // Report permissions
    { key: 'report.view', name: 'Raporları Görüntüle', category: 'report' },
    { key: 'report.export', name: 'Raporları Dışa Aktar', category: 'report' },

    // Chat permissions
    { key: 'chat.use', name: 'Canlı Sohbet Kullan', category: 'chat' },
    { key: 'chat.manage', name: 'Sohbetleri Yönet', category: 'chat' },
  ];

  for (const perm of permissionData) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: perm,
      create: perm,
    });
  }
  console.log('✅ Permissions created');

  // =============================================
  // ROLES
  // =============================================
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Sistem yöneticisi - tüm yetkiler',
      isSystem: true,
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Supervisor' },
    update: {},
    create: {
      name: 'Supervisor',
      description: 'Takım lideri - departman yönetimi',
      isSystem: true,
    },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'Agent' },
    update: {},
    create: {
      name: 'Agent',
      description: 'Destek personeli',
      isSystem: true,
    },
  });

  const requesterRole = await prisma.role.upsert({
    where: { name: 'Requester' },
    update: {},
    create: {
      name: 'Requester',
      description: 'Çalışan - ticket açabilir',
      isSystem: true,
    },
  });
  console.log('✅ Roles created');

  // =============================================
  // ROLE PERMISSIONS
  // =============================================
  const allPermissions = await prisma.permission.findMany();

  // Admin gets all permissions
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Supervisor permissions
  const supervisorPerms = ['ticket.read.department', 'ticket.read', 'ticket.create', 'ticket.update',
    'ticket.assign', 'ticket.internal_note', 'kb.read', 'kb.create', 'kb.update',
    'report.view', 'report.export', 'chat.use', 'chat.manage'];
  for (const key of supervisorPerms) {
    const perm = allPermissions.find(p => p.key === key);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: supervisorRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: supervisorRole.id, permissionId: perm.id },
      });
    }
  }

  // Agent permissions
  const agentPerms = ['ticket.read.department', 'ticket.read', 'ticket.create', 'ticket.update',
    'ticket.internal_note', 'kb.read', 'chat.use', 'chat.manage'];
  for (const key of agentPerms) {
    const perm = allPermissions.find(p => p.key === key);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: agentRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: agentRole.id, permissionId: perm.id },
      });
    }
  }

  // Requester permissions
  const requesterPerms = ['ticket.create', 'ticket.read', 'kb.read', 'chat.use'];
  for (const key of requesterPerms) {
    const perm = allPermissions.find(p => p.key === key);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: requesterRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: requesterRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('✅ Role permissions assigned');

  // =============================================
  // DEPARTMENTS
  // =============================================
  const itDept = await prisma.department.upsert({
    where: { emailAlias: 'it@tsc.local' },
    update: {},
    create: {
      name: 'Bilgi Teknolojileri',
      description: 'IT destek ve altyapı',
      emailAlias: 'it@tsc.local',
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { emailAlias: 'hr@tsc.local' },
    update: {},
    create: {
      name: 'İnsan Kaynakları',
      description: 'İK süreçleri ve personel işlemleri',
      emailAlias: 'hr@tsc.local',
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { emailAlias: 'finance@tsc.local' },
    update: {},
    create: {
      name: 'Muhasebe',
      description: 'Mali işler ve ödemeler',
      emailAlias: 'finance@tsc.local',
    },
  });

  const facilityDept = await prisma.department.upsert({
    where: { emailAlias: 'facility@tsc.local' },
    update: {},
    create: {
      name: 'Tesis Yönetimi',
      description: 'Bina ve tesis işlemleri',
      emailAlias: 'facility@tsc.local',
    },
  });

  const purchaseDept = await prisma.department.upsert({
    where: { emailAlias: 'purchase@tsc.local' },
    update: {},
    create: {
      name: 'Satın Alma',
      description: 'Tedarik ve satın alma süreçleri',
      emailAlias: 'purchase@tsc.local',
    },
  });
  console.log('✅ Departments created');

  // =============================================
  // CATEGORIES
  // =============================================
  // IT Categories
  await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Donanım Arızası', departmentId: itDept.id, sortOrder: 1 },
  });
  await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Yazılım Sorunu', departmentId: itDept.id, sortOrder: 2 },
  });
  await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Ağ/İnternet', departmentId: itDept.id, sortOrder: 3 },
  });
  await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'E-posta', departmentId: itDept.id, sortOrder: 4 },
  });
  await prisma.category.upsert({
    where: { id: 5 },
    update: {},
    create: { name: 'Yeni Ekipman Talebi', departmentId: itDept.id, sortOrder: 5 },
  });

  // HR Categories
  await prisma.category.upsert({
    where: { id: 6 },
    update: {},
    create: { name: 'İzin Talebi', departmentId: hrDept.id, sortOrder: 1 },
  });
  await prisma.category.upsert({
    where: { id: 7 },
    update: {},
    create: { name: 'Bordro Sorgusu', departmentId: hrDept.id, sortOrder: 2 },
  });
  await prisma.category.upsert({
    where: { id: 8 },
    update: {},
    create: { name: 'Eğitim Talebi', departmentId: hrDept.id, sortOrder: 3 },
  });

  // Finance Categories
  await prisma.category.upsert({
    where: { id: 9 },
    update: {},
    create: { name: 'Masraf Onayı', departmentId: financeDept.id, sortOrder: 1 },
  });
  await prisma.category.upsert({
    where: { id: 10 },
    update: {},
    create: { name: 'Fatura Sorgusu', departmentId: financeDept.id, sortOrder: 2 },
  });
  console.log('✅ Categories created');

  // =============================================
  // SLA POLICIES
  // =============================================
  const priorities = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
  const slaConfig = [
    { priority: 'URGENT', firstResponse: 60, resolution: 240 },      // 1h / 4h
    { priority: 'HIGH', firstResponse: 240, resolution: 480 },       // 4h / 8h
    { priority: 'NORMAL', firstResponse: 480, resolution: 1440 },    // 8h / 24h
    { priority: 'LOW', firstResponse: 1440, resolution: 4320 },      // 24h / 72h
  ];

  for (const dept of [itDept, hrDept, financeDept, facilityDept, purchaseDept]) {
    for (const sla of slaConfig) {
      await prisma.sLAPolicy.upsert({
        where: { departmentId_priority: { departmentId: dept.id, priority: sla.priority as TicketPriority } },
        update: {},
        create: {
          name: `${dept.name} - ${sla.priority}`,
          departmentId: dept.id,
          priority: sla.priority as TicketPriority,
          firstResponseMinutes: sla.firstResponse,
          resolutionMinutes: sla.resolution,
        },
      });
    }
  }
  console.log('✅ SLA Policies created');

  // =============================================
  // USERS
  // =============================================
  const passwordHash = await bcrypt.hash('admin123', 10);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tsc.local' },
    update: {},
    create: {
      email: 'admin@tsc.local',
      name: 'Sistem Yöneticisi',
      passwordHash,
      roleId: adminRole.id,
    },
  });

  // IT Agent
  const itAgent = await prisma.user.upsert({
    where: { email: 'it.agent@tsc.local' },
    update: {},
    create: {
      email: 'it.agent@tsc.local',
      name: 'IT Destek Uzmanı',
      passwordHash,
      roleId: agentRole.id,
    },
  });
  await prisma.userDepartment.upsert({
    where: { userId_departmentId: { userId: itAgent.id, departmentId: itDept.id } },
    update: {},
    create: { userId: itAgent.id, departmentId: itDept.id, isPrimary: true },
  });

  // HR Agent
  const hrAgent = await prisma.user.upsert({
    where: { email: 'hr.agent@tsc.local' },
    update: {},
    create: {
      email: 'hr.agent@tsc.local',
      name: 'İK Uzmanı',
      passwordHash,
      roleId: agentRole.id,
    },
  });
  await prisma.userDepartment.upsert({
    where: { userId_departmentId: { userId: hrAgent.id, departmentId: hrDept.id } },
    update: {},
    create: { userId: hrAgent.id, departmentId: hrDept.id, isPrimary: true },
  });

  // Test Requester
  const testUser = await prisma.user.upsert({
    where: { email: 'calisan@tsc.local' },
    update: {},
    create: {
      email: 'calisan@tsc.local',
      name: 'Malhotra Personel',
      passwordHash,
      roleId: requesterRole.id,
    },
  });
  console.log('✅ Users created');

  // =============================================
  // KB CATEGORIES & ARTICLES
  // =============================================
  const kbGeneral = await prisma.kBCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Genel', description: 'Genel bilgiler', sortOrder: 1 },
  });

  const kbIT = await prisma.kBCategory.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'IT Rehberi', description: 'Bilgi teknolojileri makaleleri', sortOrder: 2 },
  });

  await prisma.kBArticle.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Ticket Sistemi Nasıl Kullanılır?',
      body: `
# Ticket Sistemi Kullanım Rehberi

## Yeni Ticket Açma
1. Sol menüden "Yeni Talep" butonuna tıklayın
2. İlgili departmanı seçin
3. Kategori ve öncelik belirleyin
4. Sorununuzu detaylı açıklayın
5. Gerekirse dosya ekleyin
6. "Gönder" butonuna tıklayın

## Ticket Takibi
- Taleplerim sayfasından tüm taleplerinizi görebilirsiniz
- Her ticket için benzersiz bir numara atanır (örn: TCK-2026-000001)
- Durumu takip edebilir, yanıt yazabilirsiniz

## Öncelik Seviyeleri
- **Düşük**: Acil olmayan talepler (72 saat)
- **Normal**: Standart talepler (24 saat)
- **Yüksek**: Önemli talepler (8 saat)
- **Acil**: Kritik sorunlar (4 saat)
      `.trim(),
      excerpt: 'Ticket sisteminin temel kullanımı hakkında bilgi edinin.',
      isPublished: true,
      categoryId: kbGeneral.id,
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
  });

  await prisma.kBArticle.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Şifre Sıfırlama',
      body: `
# Şifre Sıfırlama Adımları

Windows şifrenizi unuttuysanız aşağıdaki adımları izleyin:

1. Giriş ekranında "Şifremi Unuttum" linkine tıklayın
2. E-posta adresinizi girin
3. Gelen e-postadaki linke tıklayın
4. Yeni şifrenizi belirleyin

**Not:** Şifreniz en az 8 karakter olmalı ve büyük/küçük harf, rakam içermelidir.
      `.trim(),
      excerpt: 'Windows ve sistem şifrelerinizi nasıl sıfırlayacağınızı öğrenin.',
      isPublished: true,
      categoryId: kbIT.id,
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
  });
  console.log('✅ KB articles created');

  // =============================================
  // CANNED RESPONSES
  // =============================================
  await prisma.cannedResponse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Ticket Alındı',
      body: 'Merhaba,\n\nTalebiniz alınmıştır ve en kısa sürede incelenecektir.\n\nSaygılarımızla,\nDestek Ekibi',
      shortcut: '/alindi',
      createdById: adminUser.id,
    },
  });

  await prisma.cannedResponse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Daha Fazla Bilgi Gerekli',
      body: 'Merhaba,\n\nTalebinizi işleme alabilmemiz için aşağıdaki bilgilere ihtiyacımız var:\n\n- ...\n- ...\n\nTeşekkürler.',
      shortcut: '/bilgi',
      createdById: adminUser.id,
    },
  });

  await prisma.cannedResponse.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Sorun Çözüldü',
      body: 'Merhaba,\n\nBildirdiğiniz sorun çözülmüştür. Başka bir konuda yardıma ihtiyacınız olursa lütfen yazın.\n\nİyi çalışmalar.',
      shortcut: '/cozuldu',
      createdById: adminUser.id,
    },
  });
  console.log('✅ Canned responses created');

  // =============================================
  // SYSTEM SETTINGS
  // =============================================
  const settings = [
    { key: 'app.name', value: 'Malhotra Helpdesk', type: 'string', description: 'Uygulama adı' },
    { key: 'app.logo', value: '/logo.png', type: 'string', description: 'Logo dosya yolu' },
    { key: 'ticket.prefix', value: 'TCK', type: 'string', description: 'Ticket numara öneki' },
    { key: 'ticket.autoclose.days', value: '7', type: 'number', description: 'Çözülen ticketların otomatik kapanma süresi (gün)' },
    { key: 'notification.email.enabled', value: 'true', type: 'boolean', description: 'E-posta bildirimleri aktif' },
    { key: 'sla.warning.percent', value: '80', type: 'number', description: 'SLA uyarı eşiği (%)' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log('✅ System settings created');

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Kullanıcılar:');
  console.log('   Admin: admin@tsc.local / admin123');
  console.log('   IT Agent: it.agent@tsc.local / admin123');
  console.log('   HR Agent: hr.agent@tsc.local / admin123');
  console.log('   Personel: calisan@tsc.local (şifresiz giriş)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
