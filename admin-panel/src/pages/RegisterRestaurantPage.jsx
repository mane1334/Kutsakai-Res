import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiHome, FiMail, FiMapPin, FiPhone, FiShield, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  owner_name: '',
  phone_number: '',
  email: '',
  address: '',
  cuisine_type: '',
  tax_id: '',
  restaurant_name: '',
  username: '',
  password: '',
  confirmPassword: '',
};

const cuisineOptions = [
  'Moçambicana',
  'Portuguesa',
  'Italiana',
  'Brasileira',
  'Chinesa',
  'Indiana',
  'Japonesa',
  'Mexicana',
  'Fast Food',
  'Churrasqueira',
  'Pastelaria',
  'Marisqueira',
  'Vegetariana',
  'Fusion',
  'Outra',
];

const featureCards = [
  {
    icon: FiUser,
    step: '1',
    title: 'Cadastro completo',
    description: 'Registamos o responsável, contactos e dados fiscais do restaurante.',
  },
  {
    icon: FiHome,
    step: '2',
    title: 'Restaurante liberado',
    description: 'A estrutura inicial nasce pronta para você começar a configurar.',
  },
  {
    icon: FiShield,
    step: '3',
    title: 'Entrada direta no painel',
    description: 'Após registar, entra autenticado na área administrativa.',
  },
];

const inputClassName =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100';

export default function RegisterRestaurantPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { registerRestaurant } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('A confirmação de senha não confere.');
      return;
    }

    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);

    const result = await registerRestaurant({
      owner_name: form.owner_name.trim(),
      phone_number: form.phone_number.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      cuisine_type: form.cuisine_type,
      tax_id: form.tax_id.trim(),
      restaurant_name: form.restaurant_name.trim(),
      username: form.username.trim(),
      password: form.password,
    });

    setSubmitting(false);

    if (result?.user) {
      navigate('/onboarding', {
        replace: true,
        state: { fromRegister: true, fallback: '/onboarding' },
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-8 text-slate-900 shadow-xl sm:p-10 lg:sticky lg:top-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.12),_transparent_20%)]" />
          <div className="absolute -right-16 top-0 h-52 w-52 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">Novo Restaurante</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Registre o restaurante e entre no painel pronto para configurar a operação.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">
              Este fluxo cria a conta administrativa, registra a unidade com todos os dados operacionais e fiscais, e leva você direto para as configurações iniciais.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                Conta admin criada automaticamente
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm text-slate-800">
                <FiCheckCircle className="h-4 w-4 text-amber-600" />
                Dados fiscais e localização
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {featureCards.map(({ icon: Icon, step, title, description }) => (
                <div key={step} className="rounded-3xl border border-amber-100 bg-white/85 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Etapa {step}</span>
                    <div className="rounded-2xl bg-amber-100 p-2">
                      <Icon className="h-4 w-4 text-amber-700" />
                    </div>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">Acesso Inicial</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Criar conta do restaurante</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Preencha todos os dados da unidade. Após o registo, segue direto para ajustar configurações.
              </p>
            </div>
            <div className="hidden rounded-3xl bg-amber-50 p-3 text-amber-600 sm:block">
              <FiHome className="h-6 w-6" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            {/* === Secção 1: Responsável === */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Dados do Responsável</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome completo</label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName} pl-11`}
                      name="owner_name"
                      value={form.owner_name}
                      onChange={handleChange}
                      placeholder="Ex.: Carlos Machava"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Telefone</label>
                  <div className="relative">
                    <FiPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName} pl-11`}
                      name="phone_number"
                      value={form.phone_number}
                      onChange={handleChange}
                      placeholder="Ex.: +258 84 000 0000"
                      required
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className={`${inputClassName} pl-11`}
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Ex.: restaurante@email.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* === Secção 2: Restaurante === */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Dados do Restaurante</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Nome do restaurante</label>
                  <div className="relative">
                    <FiHome className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName} pl-11`}
                      name="restaurant_name"
                      value={form.restaurant_name}
                      onChange={handleChange}
                      placeholder="Ex.: Sabor da Baixa"
                      required
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Morada / Endereço</label>
                  <div className="relative">
                    <FiMapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName} pl-11`}
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Ex.: Av. Julius Nyerere, 1234, Maputo"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tipo de cozinha</label>
                  <select
                    className={inputClassName}
                    name="cuisine_type"
                    value={form.cuisine_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione o tipo...</option>
                    {cuisineOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">NUIT (Nº fiscal)</label>
                  <input
                    className={inputClassName}
                    name="tax_id"
                    value={form.tax_id}
                    onChange={handleChange}
                    placeholder="Ex.: 400123456"
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">Número Único de Identificação Tributária</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* === Secção 3: Acesso === */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Acesso ao painel</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Usuário admin</label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName} pl-11`}
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Ex.: sabor.baixa"
                      required
                    />
                  </div>
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
                      placeholder="Mínimo 6 caracteres"
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
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              Após registar, o sistema cria a unidade com todos os dados, associa o admin e leva direto para a configuração do restaurante.
            </div>

            <div className="sticky bottom-0 -mx-8 border-t border-slate-300 bg-white px-8 pb-2 pt-5 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:-mx-10 sm:px-10">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-950 bg-slate-950 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
              >
                <span>{submitting ? 'Criando restaurante...' : 'Registar e ir para configurações'}</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem acesso?{' '}
            <Link to="/login" className="font-semibold text-slate-950 hover:text-amber-700">
              Entrar no painel
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
