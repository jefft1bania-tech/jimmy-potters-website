import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'jimmy-potters-dev-secret-change-in-production';
const MEMBERS_FILE = path.join(process.cwd(), 'data', 'members.json');

export interface Member {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  preferences: {
    newsletter: boolean;
    newProducts: boolean;
    classSchedule: boolean;
  };
}

export type PublicMember = Omit<Member, 'passwordHash'>;

function readMembers(): Member[] {
  try {
    if (!fs.existsSync(MEMBERS_FILE)) {
      fs.writeFileSync(MEMBERS_FILE, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(MEMBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeMembers(members: Member[]): void {
  fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf-8');
}

export function findMemberByEmail(email: string): Member | undefined {
  return readMembers().find((m) => m.email.toLowerCase() === email.toLowerCase());
}

export function findMemberById(id: string): Member | undefined {
  return readMembers().find((m) => m.id === id);
}

export async function createMember(email: string, name: string, password: string): Promise<Member> {
  const members = readMembers();

  if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const member: Member = {
    id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
    preferences: {
      newsletter: true,
      newProducts: true,
      classSchedule: true,
    },
  };

  members.push(member);
  writeMembers(members);
  return member;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function updateMemberPreferences(
  id: string,
  preferences: Member['preferences']
): Member | undefined {
  const members = readMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) return undefined;

  members[index].preferences = preferences;
  writeMembers(members);
  return members[index];
}

export function generateToken(member: Member): string {
  return jwt.sign(
    { id: member.id, email: member.email, name: member.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function stripPrivate(member: Member): PublicMember {
  const { passwordHash, ...pub } = member;
  return pub;
}
