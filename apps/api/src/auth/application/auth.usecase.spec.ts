import { AuthUser, NewUser, UserWithSecret } from '../domain/user.entity';
import { UserRepository } from '../domain/user-repository.port';
import { LoginUseCase } from './login.usecase';
import { PasswordHasher } from './password-hasher';
import { RegisterUseCase } from './register.usecase';
import { TokenService } from './token.service';

class InMemoryUserRepository implements UserRepository {
  users: UserWithSecret[] = [];

  async create(data: NewUser): Promise<AuthUser> {
    const user: UserWithSecret = {
      id: `u-${this.users.length + 1}`,
      email: data.email,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
    };
    this.users.push(user);
    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  async findByEmail(email: string): Promise<UserWithSecret | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const u = this.users.find((x) => x.id === id);
    return u ? { id: u.id, email: u.email, displayName: u.displayName } : null;
  }
}

const fakeTokens = {
  issue: (user: AuthUser) => ({ accessToken: 'jwt-test', user }),
} as unknown as TokenService;

describe('Auth use cases', () => {
  let repo: InMemoryUserRepository;
  let hasher: PasswordHasher;
  let register: RegisterUseCase;
  let login: LoginUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    hasher = new PasswordHasher();
    register = new RegisterUseCase(repo, hasher, fakeTokens);
    login = new LoginUseCase(repo, hasher, fakeTokens);
  });

  it('registra um usuário e devolve token (senha fica hasheada)', async () => {
    const result = await register.execute({
      email: 'Ana@Example.com',
      displayName: 'Ana',
      password: 'segredo123',
    });

    expect(result.accessToken).toBe('jwt-test');
    expect(result.user.email).toBe('ana@example.com'); // normalizado
    expect(repo.users[0].passwordHash).not.toBe('segredo123');
  });

  it('impede registro com e-mail duplicado', async () => {
    const input = { email: 'a@b.com', displayName: 'A', password: 'segredo123' };
    await register.execute(input);
    await expect(register.execute(input)).rejects.toThrow(/já cadastrado/);
  });

  it('faz login com a senha correta', async () => {
    await register.execute({ email: 'a@b.com', displayName: 'A', password: 'segredo123' });
    const result = await login.execute({ email: 'a@b.com', password: 'segredo123' });
    expect(result.user.email).toBe('a@b.com');
  });

  it('rejeita login com senha errada', async () => {
    await register.execute({ email: 'a@b.com', displayName: 'A', password: 'segredo123' });
    await expect(
      login.execute({ email: 'a@b.com', password: 'errada' }),
    ).rejects.toThrow(/Credenciais inválidas/);
  });
});
