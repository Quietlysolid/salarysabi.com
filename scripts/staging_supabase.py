"""Staging-only management client. Uses the existing Supabase CLI login."""
import base64
import ctypes
import ctypes.wintypes as w
import json
import os
from pathlib import Path
import urllib.request
import urllib.error

REF = 'vcgqxlbhsbilxlkratbw'
ROOT = Path(__file__).resolve().parents[1]

def token():
    if os.environ.get('SUPABASE_ACCESS_TOKEN'):
        return os.environ['SUPABASE_ACCESS_TOKEN']
    class Credential(ctypes.Structure):
        _fields_ = [('Flags',w.DWORD),('Type',w.DWORD),('TargetName',w.LPWSTR),('Comment',w.LPWSTR),('LastWritten',w.FILETIME),('CredentialBlobSize',w.DWORD),('CredentialBlob',ctypes.POINTER(ctypes.c_ubyte)),('Persist',w.DWORD),('AttributeCount',w.DWORD),('Attributes',ctypes.c_void_p),('TargetAlias',w.LPWSTR),('UserName',w.LPWSTR)]
    p = ctypes.POINTER(Credential)()
    for account in ('access-token', 'supabase'):
        if ctypes.windll.advapi32.CredReadW('Supabase CLI:'+account,1,0,ctypes.byref(p)):
            raw = ctypes.string_at(p.contents.CredentialBlob,p.contents.CredentialBlobSize)
            ctypes.windll.advapi32.CredFree(p)
            value = raw.decode('utf-16-le') if b'\x00' in raw else raw.decode()
            return base64.b64decode(value.split(':',1)[1]).decode() if value.startswith('go-keyring-base64:') else value
    raise RuntimeError('Sign in with the Supabase CLI first')

def management(path='', method='GET', body=None):
    request = urllib.request.Request('https://api.supabase.com/v1/projects/'+REF+path,
        data=json.dumps(body).encode() if body is not None else None, method=method,
        headers={'Authorization':'Bearer '+token(),'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=120) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Management API {error.code}: {error.read().decode()}') from None

def verify_target():
    project = management()
    assert project['name'] == 'SalarySabi Staging' and project['id'] == REF
    assert project['status'] == 'ACTIVE_HEALTHY', project['status']

def query(sql):
    return management('/database/query','POST',{'query':sql})

def bootstrap():
    verify_target()
    query('create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations(version text primary key, statements text[], name text);')
    done = {r['version'] for r in query('select version from supabase_migrations.schema_migrations')}
    skip = {'202608040004','202608040009','202608040012'}
    trim_seeds = {'202608040015','202608100001'}
    for file in sorted((ROOT/'supabase/migrations').glob('*.sql')):
        version, name = file.stem.split('_',1)
        if version in done:
            continue
        sql = file.read_text(encoding='utf-8-sig')
        notes = []
        if version in skip:
            sql = '-- Staging: production admin assignment / one-off remote request excluded.\n'
            notes.append('production-only action excluded')
        if version in trim_seeds:
            sql = sql.split('insert into public.jobs')[0]
            notes.append('historical job seeds excluded')
        sql = sql.replace('npiujcemzypvuuvnxfem.supabase.co',REF+'.supabase.co')
        # Same transaction as scheduling: no cron task can run between migration and disabling.
        if 'cron.schedule' in sql:
            sql += "\nselect cron.alter_job(jobid, active := false) from cron.job;\n"
            notes.append('scheduled jobs disabled')
        quoted = sql.replace("'","''")
        query('begin;\n'+sql+f"\ninsert into supabase_migrations.schema_migrations(version,name,statements) values ('{version}','{name}',ARRAY['{quoted}']);\ncommit;")
        print('Applied',file.name,(', '+', '.join(notes)) if notes else '',flush=True)
    query("notify pgrst, 'reload schema';")
    print('Staging migrations complete',flush=True)

if __name__ == '__main__':
    bootstrap()
