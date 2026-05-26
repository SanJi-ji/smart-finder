import { useState, useMemo, useCallback, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import DetailPanel from '../components/DetailPanel';
import useConfirmModal from '../hooks/useConfirmModal';
import useSearch from '../hooks/useSearch';
import useFormHandler from '../hooks/useFormHandler';
import { useToast } from '../components/Toast';
import { fetchClaims, createClaim, updateClaimStatus, fetchItems } from '../services/api';
import '../styles/Pages.css';

const EMPTY_FORM = { claimant: '', item: '', proof: '', contact: '', date: '' };
const SEARCH_FIELDS = ['claimant_name', 'claimant_username', 'item_name'];

const CONFIRM_ACTIONS = {
    approve: {
        title: 'Approve Claim',
        message: 'Are you sure you want to approve this claim? The item will be marked for release.',
        confirmLabel: 'Approve',
        variant: 'primary',
    },
    reject: {
        title: 'Reject Claim',
        message: 'Are you sure you want to reject this claim? This action cannot be undone.',
        confirmLabel: 'Reject',
        variant: 'danger',
    },
    release: {
        title: 'Release Item',
        message: 'Are you sure the item has been released to the claimant?',
        confirmLabel: 'Release',
        variant: 'warning',
    },
    submit: {
        title: 'Confirm Claim',
        message: 'Are you sure you want to log this claim?',
        confirmLabel: 'Submit Claim',
        variant: 'primary',
    },
};

function ClaimValidation() {
    const [claims, setClaims] = useState([]);
    const [foundItems, setFoundItems] = useState([]);
    const { form, feedback, handleChange, resetForm, showFeedback } = useFormHandler(EMPTY_FORM);
    const { confirm, openConfirm, closeConfirm, confirmProps } = useConfirmModal(CONFIRM_ACTIONS);
    const { searchTerm, setSearchTerm, filtered } = useSearch(claims, SEARCH_FIELDS);
    const { showToast } = useToast();
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [itemSearch, setItemSearch] = useState('');

    const loadData = useCallback(async () => {
        try {
            const claimsData = await fetchClaims();
            setClaims(claimsData);
            const itemsData = await fetchItems();
            // Only keep "Found" items that are "Approved" (not released) for the dropdown
            setFoundItems(itemsData.filter(i => i.type === 'Found' && i.status === 'Approved'));
        } catch (err) {
            console.error('Failed to load claims', err);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Memoize mini-stat counts so they only recompute when claims change
    const miniStats = useMemo(() => ({
        pending: claims.filter(c => c.status === 'Pending').length,
        approved: claims.filter(c => c.status === 'Approved').length,
        released: claims.filter(c => c.status === 'Released').length,
        rejected: claims.filter(c => c.status === 'Rejected').length,
    }), [claims]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!form.claimant || !form.item || !form.proof || !form.contact || !form.date) {
            showFeedback('Please fill in all required fields.', 0);
            return;
        }
        openConfirm(null, 'submit');
    }, [form, openConfirm, showFeedback]);

    const handleConfirm = useCallback(async () => {
        const { id, action } = confirm;
        try {
            if (action === 'submit') {
                await createClaim({
                    claimant_name: form.claimant,
                    item: form.item, // ID of the item
                    proof: form.proof,
                    contact_info: form.contact,
                });
                showFeedback('Claim logged successfully!');
                showToast('Claim logged successfully!', 'success');
                resetForm();
            } else {
                let newStatus = '';
                if (action === 'approve') newStatus = 'Approved';
                else if (action === 'reject') newStatus = 'Rejected';
                else if (action === 'release') newStatus = 'Released';
                
                await updateClaimStatus(id, newStatus);
                const messages = {
                    Approved: ['Claim approved!', 'success'],
                    Rejected: ['Claim rejected.', 'error'],
                    Released: ['Item released to claimant! ✅', 'success'],
                };
                if (messages[newStatus]) showToast(...messages[newStatus]);
            }
            // Refresh data from server
            loadData();
        } catch (err) {
            showToast('Action failed. Please try again.', 'error');
            console.error(err);
        } finally {
            closeConfirm();
            setSelectedClaim(null);
        }
    }, [confirm, closeConfirm, form, resetForm, showFeedback, showToast, loadData]);

    const detailFields = [
        { label: 'Claimant Name', key: 'claimant_name', render: (val, c) => val || c.claimant_username || 'Admin' },
        { label: 'Item', key: 'item_name' },
        { label: 'Proof of Ownership', key: 'proof' },
        { label: 'Contact', key: 'contact_info' },
        { label: 'Claim Date', key: 'created_at', render: (val) => new Date(val).toLocaleDateString() },
        { label: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
        { label: 'Release Date', key: 'release_date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    ];

    return (
        <main className="page-container">
            <div className="page-header">
                <h1>Claim Validation &amp; Release Tracking</h1>
                <p>Validate item claims, approve ownership, and track item release.</p>
            </div>

            {/* Summary Stats */}
            <div className="mini-stats">
                <div className="mini-stat">
                    <span className="mini-stat-count">{miniStats.pending}</span>
                    <span className="mini-stat-label">Pending</span>
                </div>
                <div className="mini-stat">
                    <span className="mini-stat-count">{miniStats.approved}</span>
                    <span className="mini-stat-label">Approved</span>
                </div>
                <div className="mini-stat">
                    <span className="mini-stat-count">{miniStats.released}</span>
                    <span className="mini-stat-label">Released</span>
                </div>
                <div className="mini-stat">
                    <span className="mini-stat-count">{miniStats.rejected}</span>
                    <span className="mini-stat-label">Rejected</span>
                </div>
            </div>

            {/* Claim Form */}
            <section className="form-card">
                <h2>Log New Claim</h2>
                {feedback && <div className={`form-feedback ${feedback.includes('success') ? 'success' : 'error'}`}>{feedback}</div>}
                <form onSubmit={handleSubmit} className="page-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cv-claimant">Claimant Name *</label>
                            <input id="cv-claimant" type="text" name="claimant" value={form.claimant} onChange={handleChange} placeholder="Full name" />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Search & Select Found Item *</label>
                            <input 
                                type="text" 
                                placeholder="🔍 Search by item name or location..." 
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                                style={{ width: '100%', marginBottom: '8px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
                            />
                            
                            <div className="custom-select-dropdown" style={{ 
                                maxHeight: '220px', 
                                overflowY: 'auto', 
                                border: '1px solid var(--border)', 
                                borderRadius: '8px',
                                backgroundColor: 'var(--surface)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                {foundItems.filter(i => 
                                    i.item_name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                                    i.location.toLowerCase().includes(itemSearch.toLowerCase())
                                ).map(item => {
                                    const isSelected = form.item === item.id;
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleChange({ target: { name: 'item', value: item.id } })}
                                            style={{ 
                                                padding: '12px 16px', 
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--border)',
                                                backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                                                color: isSelected ? 'var(--primary)' : 'var(--text-dark)',
                                                fontWeight: isSelected ? '600' : '400',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                                            onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{item.item_name}</span>
                                                {isSelected && <span style={{ fontSize: '14px' }}>✅</span>}
                                            </div>
                                            <span style={{ fontSize: '12px', color: isSelected ? 'var(--primary)' : 'var(--text-light)', opacity: 0.8 }}>
                                                📍 {item.location}
                                            </span>
                                        </div>
                                    );
                                })}
                                {foundItems.filter(i => 
                                    i.item_name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                                    i.location.toLowerCase().includes(itemSearch.toLowerCase())
                                ).length === 0 && (
                                    <div style={{ padding: '24px', color: 'var(--text-light)', textAlign: 'center', fontSize: '14px' }}>
                                        No items matching "{itemSearch}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cv-proof">Proof of Ownership *</label>
                            <input id="cv-proof" type="text" name="proof" value={form.proof} onChange={handleChange} placeholder="Describe proof..." />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cv-contact">Contact Info *</label>
                            <input id="cv-contact" type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone or email" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="cv-date">Claim Date *</label>
                            <input id="cv-date" type="date" name="date" value={form.date} onChange={handleChange} />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary">Submit Claim</button>
                </form>
            </section>

            {/* Claims Table */}
            <section className="table-card">
                <div className="search-header">
                    <h2>All Claims ({filtered.length})</h2>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search claims..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Claimant</th>
                                <th>Item</th>
                                <th>Proof</th>
                                <th>Contact</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Release Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} className="clickable-row" onClick={() => setSelectedClaim(c)}>
                                    <td>{c.claimant_name || c.claimant_username || 'Admin'}</td>
                                    <td>{c.item_name}</td>
                                    <td>{c.proof}</td>
                                    <td>{c.contact_info}</td>
                                    <td className="date-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td className="date-cell">{c.release_date ? new Date(c.release_date).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <p className="empty-state">No claims found.</p>}
                </div>
            </section>

            <ConfirmModal
                isOpen={confirm.open}
                title={confirmProps.title}
                message={confirmProps.message}
                confirmLabel={confirmProps.confirmLabel}
                variant={confirmProps.variant}
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />

            <DetailPanel
                isOpen={!!selectedClaim}
                onClose={() => setSelectedClaim(null)}
                title="Claim Details"
                data={selectedClaim || {}}
                fields={detailFields}
                actions={
                    <>
                        {selectedClaim?.status === 'Pending' && (
                            <>
                                <button className="btn-danger" onClick={() => openConfirm(selectedClaim.id, 'reject')}>Reject</button>
                                <button className="btn-primary" onClick={() => openConfirm(selectedClaim.id, 'approve')}>Approve</button>
                            </>
                        )}
                        {selectedClaim?.status === 'Approved' && (
                            <button className="btn-release" onClick={() => openConfirm(selectedClaim.id, 'release')}>Release Item</button>
                        )}
                    </>
                }
            />
        </main>
    );
}

export default ClaimValidation;
