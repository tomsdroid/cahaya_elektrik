<img width="1456" height="720" alt="GH-Social-Image" src="https://github.com/user-attachments/assets/a6c7cf50-0207-4ff0-bb5d-7326be9a8d6a" />

## Siapa Kami?

Cahaya Elektrik adalah penyedia layanan IT dan Keamanan terdepan.

Lahir dari kebutuhan teknis komparatif di lapangan, Cahaya Elektrik bukan sekadar penyedia kabel. Kami adalah integrator sistem bersertifikat yang mengutamakan kerapihan dokumentasi jalur kabel (*cable management*) dan optimalisasi *bandwidth*.

> ## Visi Kami
> Menjadi perusahaan penyedia solusi IT dan sistem keamanan terintegrasi nomor satu yang mengedepankan kualitas pengerjaan dan kepuasan pelanggan secara mutlak.

> ## Misi Kami
> - Memberikan pelayanan instalasi yang rapi, profesional, dan bergaransi.
> - Menyediakan produk CCTV dan kelistrikan berkualitas dengan harga bersaing.
> - Membangun hubungan jangka panjang dengan pelanggan melalui after-sales terbaik.

## Mengelola Portofolio

Setiap file `contents/*.md` menjadi satu kartu dan halaman detail portofolio. Setelah menambah atau mengubah file Markdown, jalankan generator dari folder proyek:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Generator memperbarui `portfolio-data.js`, yang digunakan oleh halaman Beranda dan Portofolio. Markdown dapat berisi judul `#`, subjudul `##`, paragraf, daftar, kutipan, blok kode, tautan, dan gambar. Front matter di awal file bersifat opsional; `title`, `category`, dan `summary` dapat dipakai untuk mengatur judul kartu, kategori, dan ringkasan.

Contoh:

```markdown
---
title: Instalasi Jaringan Kantor
category: Infrastruktur
summary: Penataan jaringan untuk ruang kerja.
---

## Lingkup pekerjaan

- Instalasi titik jaringan
- Konfigurasi perangkat
```
