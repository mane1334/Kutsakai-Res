import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiShield, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { setupSuperadmin } from '../services/api';

const inputClassName =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';

export default function SetupSuperadminPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.username.trim() || !form.password) {
      toast.error('Preencha usuario e senha.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('A confirmacao de senha nao confere.');
      return;
    }

    setSubmitting(true);

    try {
      await setupSuperadmin({
        username: form.username.trim(),
        password: form.password,
      });
      toast.success('Superadmin inicial criado com sucesso.');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error?.response?.data?.error || 'Nao foi possivel criar o superadmin inicial.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-200 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-8 shadow-xl sm:p-10 lg:sticky lg:top-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.12),_transparent_22%)]" />
          <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative">
            <div className="w-fit rounded-3xl bg-sky-100 p-3 text-sky-700">
              <FiShield className="h-7 w-7" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Setup Inicial</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Crie o primeiro superadmin da plataforma.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">
              Esta etapa deve ser usada apenas uma vez para liberar o acesso global da plataforma com uma conta
              principal segura.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm text-slate-800">
                <FiUserCheck className="h-4 w-4 text-sky-700" />
                Acesso global ao painel da rede
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                <FiShield className="h-4 w-4 text-amber-700" />
                Setup bloqueia apos criar um superadmin
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-sky-100 bg-white/85 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <FiUserCheck className="h-5 w-5 text-sky-700" />
                  <h2 className="text-lg font-semibold text-slate-950">Conta com acesso global</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  O superadmin pode abrir o painel global, comparar restaurantes e ativar ou desativar unidades.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                Se aparecer a mensagem <strong>&ldquo;Setup ja realizado&rdquo;</strong>, significa que já existe um
                <strong> superadmin</strong> cadastrado e o acesso deve seguir pela tela normal de login.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Primeiro Superadmin</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Cadastrar acesso inicial</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Defina um usuario e uma senha fortes para a conta principal da plataforma.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Usuario</label>
              <input
                className={inputClassName}
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Ex.: root-admin"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Senha</label>
                <input
                  type="password"
                  className={inputClassName}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirmar senha</label>
                <input
                  type="password"
                  className={inputClassName}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              Depois da criacao inicial, o acesso do superadmin passa a acontecer somente pelo login padrao da
              plataforma.
            </div>

            <div className="sticky bottom-0 -mx-8 border-t border-slate-300 bg-white px-8 pb-2 pt-5 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:-mx-10 sm:px-10">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-800 bg-sky-800 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: '#075985', color: '#ffffff', borderColor: '#075985' }}
              >
                <span>{submitting ? 'Criando superadmin...' : 'Criar superadmin inicial'}</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ja possui acesso?{' '}
            <Link to="/login" className="font-semibold text-slate-950 hover:text-sky-700">
              Voltar para login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
