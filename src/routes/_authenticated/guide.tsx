import { createFileRoute } from "@tanstack/react-router";
import { useMyProfile } from "@/hooks/useProfile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/guide")({
  head: () => ({
    meta: [
      { title: "Panduan Pengguna — OrgTool" },
      {
        name: "description",
        content: "Panduan singkat memakai OrgTool sesuai peran kamu di organisasi.",
      },
      { property: "og:title", content: "Panduan Pengguna — OrgTool" },
      {
        property: "og:description",
        content: "Panduan singkat memakai OrgTool sesuai peran kamu di organisasi.",
      },
    ],
  }),
  component: GuidePage,
});

const MENU_GUIDE: { title: string; body: string }[] = [
  {
    title: "Dashboard",
    body: "Ringkasan cepat organisasi: jumlah anggota, keuangan, event aktif, dan pengumuman penting. Buka ini tiap kali mulai bekerja.",
  },
  {
    title: "Ruang Kerja Saya",
    body: "Papan tugas pribadi kamu. Geser kartu tugas sesuai progres dan tambahkan tugas baru saat ada pekerjaan masuk.",
  },
  {
    title: "Kalender",
    body: "Semua jadwal rapat, event, dan tenggat tugas dalam satu tampilan bulanan.",
  },
  {
    title: "Tugas dari Pembina",
    body: "Daftar tugas yang diberikan Pembina. Kumpulkan hasil kerjamu di sini sebelum tenggat.",
  },
  {
    title: "Pengumuman",
    body: "Info resmi organisasi. Tandai sudah dibaca agar pengurus tahu informasi sudah sampai.",
  },
  {
    title: "Pengajuan Dana",
    body: "Ajukan dana kegiatan atau reimbursement, lalu pantau statusnya sampai disetujui dan dicairkan.",
  },
  {
    title: "Anggaran & Feed Keuangan",
    body: "Lihat pagu anggaran divisi/event dan riwayat semua transaksi masuk-keluar.",
  },
  {
    title: "Perusahaan, Pipeline, dan MoU",
    body: "Catatan mitra eksternal: kontak perusahaan, tahap negosiasi sponsor, dan dokumen kerja sama.",
  },
  {
    title: "Events & Speaker",
    body: "Kelola acara dari perencanaan sampai selesai, termasuk rundown dan daftar pembicara.",
  },
  {
    title: "Anggota, Divisi, Rapat, Profil",
    body: "Data organisasi: siapa di divisi mana, notulen rapat, dan profil kamu sendiri.",
  },
];

const ROLE_GUIDE: Record<string, { title: string; items: string[] }> = {
  Anggota: {
    title: "Panduan untuk Anggota",
    items: [
      "Perbarui status tugas di Ruang Kerja Saya setiap ada kemajuan.",
      "Ajukan permintaan surat lewat menu terkait dan tunggu nomor surat terbit.",
      "Ajukan reimbursement di Pengajuan Dana, lampirkan bukti/nota yang jelas.",
      "Kumpulkan tugas dari Pembina sebelum tenggat di menu Tugas dari Pembina.",
      "Baca Pengumuman rutin dan tandai sudah dibaca.",
    ],
  },
  Kadiv: {
    title: "Tambahan untuk Kepala Divisi",
    items: [
      "Kelola Key Result divisi dan pastikan tiap anggota punya target jelas.",
      "Pantau Progres Anggota divisimu dan bantu yang tertinggal.",
      "Bagi sub-anggaran divisi supaya tiap program punya pagu.",
      "Buat pengumuman khusus divisi bila ada info internal.",
    ],
  },
  Controller: {
    title: "Tambahan untuk Controller",
    items: [
      "Proses approval pengajuan dana yang masuk secepatnya.",
      "Catat transaksi masuk dan keluar di Feed Keuangan.",
      "Kelola anggaran dan kategori transaksi agar laporan rapi.",
    ],
  },
  Sekretaris: {
    title: "Tambahan untuk Sekretaris",
    items: [
      "Review permintaan surat custom sebelum diterbitkan.",
      "Kelola penomoran surat agar berurutan dan tidak bentrok.",
      "Rapikan notulen dan keputusan rapat di menu Rapat.",
    ],
  },
  Ketua: {
    title: "Tambahan untuk Ketua / Wakil Ketua",
    items: [
      "Susun Objective organisasi dan pantau capaiannya.",
      "Gunakan Command Center untuk melihat kesehatan organisasi dan red flag.",
      "Undang anggota baru lewat menu Undangan (kode divisi atau link personal).",
      "Atur identitas organisasi di Pengaturan.",
    ],
  },
  Supervisor: {
    title: "Tambahan untuk Pembina",
    items: [
      "Buat dan tugaskan tugas pembinaan lewat Kelola Tugas.",
      "Pantau semua divisi dan progres anggota dari Command Center.",
      "Berikan persetujuan pada pengajuan yang memerlukan Pembina.",
    ],
  },
};

function GuidePage() {
  const { data: profile } = useMyProfile();
  const role = profile?.role ?? "Anggota";
  const roleKey = role === "Waketu" ? "Ketua" : role;
  const roleGuide = ROLE_GUIDE[roleKey];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panduan Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Panduan singkat memakai OrgTool. Disesuaikan dengan peran kamu: <strong>{role}</strong>.
        </p>
      </div>

      {roleGuide && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{roleGuide.title}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {roleGuide.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-2 shadow-sm sm:p-4">
        <h2 className="px-2 py-2 text-lg font-semibold">Fungsi Tiap Menu</h2>
        <Accordion type="single" collapsible className="w-full">
          {MENU_GUIDE.map((m) => (
            <AccordionItem key={m.title} value={m.title}>
              <AccordionTrigger className="px-2 text-left">{m.title}</AccordionTrigger>
              <AccordionContent className="px-2 text-sm text-muted-foreground">
                {m.body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <p className="text-xs text-muted-foreground">
        Masih bingung? Tanyakan ke Kepala Divisi atau Ketua kamu.
      </p>
    </div>
  );
}
