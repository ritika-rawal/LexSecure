import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Scale,
  ScrollText,
  ShieldBan,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoutButton from '../../auth/components/LogoutButton.jsx';
import FieldError from '../../auth/components/FieldError.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  createIpAccessRule,
  deleteIpAccessRule,
  getIpAccessRules,
  updateIpAccessRuleStatus,
} from '../api/ipAccess.api.js';

const INITIAL_FORM = Object.freeze({
  type: 'block',
  network: '',
  description: '',
  isActive: true,
});

const validateRule = ({ network, description }) => {
  const errors = {};
  const trimmedNetwork = network.trim();

  if (trimmedNetwork.length < 2 || trimmedNetwork.length > 135) {
    errors.network = 'Enter an IPv4 or IPv6 address with an optional CIDR prefix.';
  }

  if (description.trim().length > 120) {
    errors.description = 'Description must not exceed 120 characters.';
  }

  return errors;
};

const IpAccessPage = () => {
  const [rules, setRules] = useState([]);
  const [sourceIp, setSourceIp] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRuleId, setPendingRuleId] = useState(null);
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRules = useCallback(async (signal) => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getIpAccessRules({ signal });
      setRules(response.data.rules);
      setSourceIp(response.data.sourceIp);
    } catch (error) {
      if (axios.isCancel(error)) return;
      setLoadError(getAuthApiError(error, 'IP access rules could not be loaded.').message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRules(controller.signal);
    return () => controller.abort();
  }, [loadRules, reloadKey]);

  const activeAllowCount = useMemo(
    () => rules.filter((rule) => rule.type === 'allow' && rule.isActive).length,
    [rules],
  );

  const updateForm = ({ target: { name, type, checked, value } }) => {
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFeedback('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const validationErrors = validateRule(form);
    setErrors(validationErrors);
    setLoadError('');
    setFeedback('');

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await createIpAccessRule({
        ...form,
        network: form.network.trim(),
        description: form.description.trim(),
      });
      setRules((current) => [response.data.rule, ...current]);
      setForm(INITIAL_FORM);
      setFeedback(response.message);
    } catch (error) {
      const apiError = getAuthApiError(error, 'IP access rule could not be created.');
      setLoadError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (rule) => {
    setPendingRuleId(rule.id);
    setLoadError('');
    setFeedback('');

    try {
      const response = await updateIpAccessRuleStatus({
        ruleId: rule.id,
        isActive: !rule.isActive,
      });
      setRules((current) => current.map((item) => (
        item.id === rule.id ? response.data.rule : item
      )));
      setFeedback(response.message);
    } catch (error) {
      setLoadError(getAuthApiError(error, 'Rule status could not be changed.').message);
    } finally {
      setPendingRuleId(null);
    }
  };

  const handleDelete = async (ruleId) => {
    setPendingRuleId(ruleId);
    setLoadError('');
    setFeedback('');

    try {
      await deleteIpAccessRule(ruleId);
      setRules((current) => current.filter((rule) => rule.id !== ruleId));
      setDeleteRuleId(null);
      setFeedback('IP access rule deleted successfully.');
    } catch (error) {
      setLoadError(getAuthApiError(error, 'IP access rule could not be deleted.').message);
    } finally {
      setPendingRuleId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f5] text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-lg font-bold leading-5">LexSecure</span>
              <span className="text-xs text-gray-600">Network security</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link aria-label="Admin account security" className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100" title="Account security" to="/admin/account">
              <UserRound aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link className="flex h-10 items-center gap-2 border border-gray-300 bg-white px-3 text-sm font-semibold hover:bg-gray-100" to="/admin/audit-logs">
              <ScrollText aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Audit logs</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">Security operations</p>
            <h1 className="text-3xl font-bold sm:text-4xl">IP access policy</h1>
            <p className="mt-2 text-gray-600">
              {activeAllowCount > 0
                ? `Allowlist mode active with ${activeAllowCount} ${activeAllowCount === 1 ? 'network' : 'networks'}.`
                : 'Allowlist mode inactive. Active block rules are enforced.'}
            </p>
            {sourceIp ? <p className="mt-1 font-mono text-xs text-gray-500">Current source: {sourceIp}</p> : null}
          </div>
          <button className="flex h-10 w-fit items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60" disabled={isLoading} onClick={() => setReloadKey((current) => current + 1)} type="button">
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {feedback ? (
          <div className="mb-6 flex gap-3 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900" role="status">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{feedback}</p>
          </div>
        ) : null}
        {loadError ? (
          <div className="mb-6 flex gap-3 border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{loadError}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="h-fit border border-line bg-white" aria-labelledby="new-rule-heading">
            <div className="border-b border-line px-5 py-4">
              <h2 id="new-rule-heading" className="text-lg font-bold">New network rule</h2>
            </div>
            <form className="space-y-5 p-5" noValidate onSubmit={handleCreate}>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Rule type</legend>
                <div className="grid grid-cols-2 gap-2">
                  {['block', 'allow'].map((type) => (
                    <label className={`flex h-10 cursor-pointer items-center justify-center border text-sm font-semibold capitalize ${form.type === type ? 'border-forest bg-emerald-50 text-forest' : 'border-gray-300 bg-white'}`} key={type}>
                      <input checked={form.type === type} className="sr-only" name="type" onChange={updateForm} type="radio" value={type} />
                      {type}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="network">IP address or CIDR</label>
                <input className="form-input pl-3" id="network" maxLength={135} name="network" onChange={updateForm} placeholder="203.0.113.0/24" spellCheck="false" value={form.network} aria-describedby={errors.network ? 'network-error' : undefined} aria-invalid={Boolean(errors.network)} />
                <FieldError id="network-error" message={errors.network} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="description">Description</label>
                <input className="form-input pl-3" id="description" maxLength={120} name="description" onChange={updateForm} placeholder="Office network" value={form.description} aria-describedby={errors.description ? 'description-error' : undefined} aria-invalid={Boolean(errors.description)} />
                <FieldError id="description-error" message={errors.description} />
              </div>
              <label className="flex items-center justify-between gap-4 border border-line bg-gray-50 px-3 py-3 text-sm font-semibold">
                Enable immediately
                <input checked={form.isActive} className="h-4 w-4 accent-forest" name="isActive" onChange={updateForm} type="checkbox" />
              </label>
              <button className="flex h-11 w-full items-center justify-center gap-2 bg-forest px-4 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Plus aria-hidden="true" className="h-5 w-5" />}
                {isSubmitting ? 'Creating rule' : 'Create rule'}
              </button>
            </form>
          </section>

          <section aria-labelledby="rules-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="rules-heading" className="text-lg font-bold">Network rules</h2>
              <span className="text-sm text-gray-600">{rules.length} {rules.length === 1 ? 'rule' : 'rules'}</span>
            </div>

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-live="polite">
                <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
                Loading network rules
              </div>
            ) : null}

            {!isLoading && rules.length === 0 ? (
              <div className="border border-line bg-white px-6 py-16 text-center">
                <ShieldBan aria-hidden="true" className="mx-auto h-9 w-9 text-forest" />
                <h3 className="mt-4 text-xl font-bold">No network rules</h3>
                <p className="mt-2 text-gray-600">API access is currently unrestricted by network.</p>
              </div>
            ) : null}

            {!isLoading && rules.length > 0 ? (
              <div className="overflow-x-auto border border-line bg-white">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead className="bg-ink text-white">
                    <tr>
                      {['Type', 'Network', 'Description', 'Status', 'Actions'].map((heading) => <th className="px-4 py-3 font-semibold" key={heading}>{heading}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rules.map((rule) => (
                      <tr className="hover:bg-gray-50" key={rule.id}>
                        <td className="px-4 py-4"><span className={`inline-flex border px-2 py-1 text-xs font-semibold capitalize ${rule.type === 'block' ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{rule.type}</span></td>
                        <td className="px-4 py-4 font-mono text-xs font-semibold">{rule.network}</td>
                        <td className="max-w-64 px-4 py-4 text-gray-600">{rule.description || 'None'}</td>
                        <td className="px-4 py-4">
                          <button aria-checked={rule.isActive} className={`relative h-6 w-11 border transition-colors ${rule.isActive ? 'border-forest bg-forest' : 'border-gray-400 bg-gray-300'}`} disabled={pendingRuleId === rule.id} onClick={() => handleStatusChange(rule)} role="switch" title={rule.isActive ? 'Disable rule' : 'Enable rule'} type="button">
                            <span className={`absolute top-0.5 h-4 w-4 bg-white transition-transform ${rule.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            <span className="sr-only">{rule.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {deleteRuleId === rule.id ? (
                            <div className="flex items-center gap-2">
                              <button className="h-8 bg-red-700 px-3 text-xs font-semibold text-white" disabled={pendingRuleId === rule.id} onClick={() => handleDelete(rule.id)} type="button">Confirm</button>
                              <button className="h-8 border border-gray-300 px-3 text-xs font-semibold" disabled={pendingRuleId === rule.id} onClick={() => setDeleteRuleId(null)} type="button">Cancel</button>
                            </div>
                          ) : (
                            <button aria-label={`Delete ${rule.network} rule`} className="grid h-9 w-9 place-items-center border border-gray-300 text-red-700 hover:bg-red-50" onClick={() => setDeleteRuleId(rule.id)} title="Delete rule" type="button">
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
};

export default IpAccessPage;
