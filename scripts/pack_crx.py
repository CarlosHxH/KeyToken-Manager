#!/usr/bin/env python3
"""📦 Empacota a extensão em CRX3 e gera o updates.xml (auto-update do Chrome).

Sem dependências Python externas: usa apenas a stdlib e o binário `openssl`
para assinar com a chave privada RSA (PEM).

Uso:
  python scripts/pack_crx.py --key key.pem --out dist \\
      --crx-url https://<usuario>.github.io/<repo>/keytoken-manager.crx
"""
import argparse
import hashlib
import io
import json
import os
import struct
import subprocess
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRX_NAME = 'keytoken-manager.crx'

# Itens fora do pacote (o resto da raiz do repositório é incluído)
EXCLUDE_DIRS = {'scripts', 'dist'}
EXCLUDE_EXT = {'.md', '.pem', '.crx', '.zip'}


def collect_files(src):
    files = []
    for dirpath, dirnames, filenames in os.walk(src):
        rel_dir = os.path.relpath(dirpath, src)
        dirnames[:] = sorted(
            d for d in dirnames
            if not d.startswith('.') and not (rel_dir == '.' and d in EXCLUDE_DIRS)
        )
        for name in sorted(filenames):
            if name.startswith('.') or os.path.splitext(name)[1].lower() in EXCLUDE_EXT:
                continue
            full = os.path.join(dirpath, name)
            files.append((os.path.relpath(full, src).replace(os.sep, '/'), full))
    return files


def build_zip(src):
    """Zip determinístico (ordem e datas fixas) do conteúdo da extensão."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for arcname, full in collect_files(src):
            info = zipfile.ZipInfo(arcname, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            with open(full, 'rb') as f:
                zf.writestr(info, f.read())
    return buf.getvalue()


def openssl(args, data=None):
    return subprocess.run(['openssl'] + args, input=data, check=True,
                          stdout=subprocess.PIPE).stdout


# ── Protobuf mínimo (apenas campos length-delimited) ──────────

def varint(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def pb_bytes(field, value):
    return varint((field << 3) | 2) + varint(len(value)) + value


def extension_id(public_key_der):
    """ID da extensão: 32 primeiros hex do SHA-256 da chave pública, 0-f → a-p."""
    digest = hashlib.sha256(public_key_der).hexdigest()[:32]
    return ''.join(chr(ord('a') + int(c, 16)) for c in digest)


def build_crx(zip_bytes, key_path):
    public_key = openssl(['pkey', '-in', key_path, '-pubout', '-outform', 'DER'])
    crx_id = hashlib.sha256(public_key).digest()[:16]

    signed_data = pb_bytes(1, crx_id)  # SignedData.crx_id
    to_sign = (b'CRX3 SignedData\x00' + struct.pack('<I', len(signed_data))
               + signed_data + zip_bytes)
    signature = openssl(['dgst', '-sha256', '-sign', key_path], to_sign)

    proof = pb_bytes(1, public_key) + pb_bytes(2, signature)   # AsymmetricKeyProof
    header = pb_bytes(2, proof) + pb_bytes(10000, signed_data)  # CrxFileHeader

    crx = b'Cr24' + struct.pack('<II', 3, len(header)) + header + zip_bytes
    return crx, extension_id(public_key)


def build_update_xml(app_id, version, crx_url):
    return (
        "<?xml version='1.0' encoding='UTF-8'?>\n"
        "<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>\n"
        f"  <app appid='{app_id}'>\n"
        f"    <updatecheck codebase='{crx_url}' version='{version}' />\n"
        "  </app>\n"
        "</gupdate>\n"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--key', required=True, help='chave privada RSA (PEM)')
    parser.add_argument('--out', default=os.path.join(ROOT, 'dist'), help='pasta de saída')
    parser.add_argument('--crx-url', required=True, help='URL pública do .crx')
    parser.add_argument('--src', default=ROOT, help='pasta da extensão')
    args = parser.parse_args()

    # Console do Windows (cp1252) não imprime emojis
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')

    with open(os.path.join(args.src, 'manifest.json'), encoding='utf-8') as f:
        version = json.load(f)['version']

    zip_bytes = build_zip(args.src)
    crx, app_id = build_crx(zip_bytes, args.key)

    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out, CRX_NAME), 'wb') as f:
        f.write(crx)
    with open(os.path.join(args.out, 'keytoken-manager.zip'), 'wb') as f:
        f.write(zip_bytes)
    with open(os.path.join(args.out, 'updates.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(build_update_xml(app_id, version, args.crx_url))

    print(f'✅ {CRX_NAME} v{version} · ID {app_id}')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as f:
            f.write(f'version={version}\nextension_id={app_id}\n')


if __name__ == '__main__':
    sys.exit(main())
