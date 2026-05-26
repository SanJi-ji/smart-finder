import { useState, useMemo, useCallback, useEffect } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import DetailPanel from '../components/DetailPanel';
import useConfirmModal from '../hooks/useConfirmModal';
import useSearch from '../hooks/useSearch';
import { useToast } from '../components/Toast';
import { fetchItems, updateItemStatus, deleteItem } from '../services/api';
import '../styles/App.css';
import '../styles/Pages.css';

const SEARCH_FIELDS = ['item_name', 'location', 'submittedBy'];

const CONFIRM_ACTIONS = {
    approve: {
        title: 'Approve Post',
        message: 'Are you sure you want to approve this post? It will be visible to all users.',
        confirmLabel: 'Approve',
        variant: 'primary',
    },
    reject: {
        title: 'Reject Post',
        message: 'Are you sure you want to reject this post? This action cannot be undone.',
        confirmLabel: 'Reject',
        variant: 'danger',
    },
    delete: {
        title: 'Delete Post',
        message: 'Are you sure you want to completely delete this post? This action cannot be undone and will remove it everywhere permanently.',
        confirmLabel: 'Delete',
        variant: 'danger',
    },
};

function Dashboard() {
    const [items, setItems] = useState([]);
    
    useEffect(() => {
        const loadItems = async () => {
            try {
                const data = await fetchItems();
                setItems(data);
            } catch (err) {
                console.error('Failed to load items:', err);
            }
        };
        loadItems();
    }, []);
    const { confirm, openConfirm, closeConfirm, confirmProps } = useConfirmModal(CONFIRM_ACTIONS);
    const { showToast } = useToast();
    
    // Only show Pending Review items in the main dashboard table
    const pendingItems = useMemo(() => items.filter(i => i.status === 'Pending Review'), [items]);
    const { searchTerm, setSearchTerm, filtered: filteredItems } = useSearch(pendingItems, SEARCH_FIELDS);
    
    const [selectedItem, setSelectedItem] = useState(null);

    // Memoize stats so they only recompute when items change
    const stats = useMemo(() => ({
        pendingReview: items.filter(i => i.status === 'Pending Review').length,
        approvedToday: items.filter(i => i.status === 'Approved').length,
        totalReports: items.length,
        rejected: items.filter(i => i.status === 'Rejected').length,
    }), [items]);

    const handleConfirm = useCallback(async () => {
        const { id, action } = confirm;
        try {
            if (action === 'approve') {
                await updateItemStatus(id, 'Approved');
                setItems(prev => prev.map(item =>
                    item.id === id ? { ...item, status: 'Approved' } : item
                ));
                showToast('Post approved successfully!', 'success');
            } else if (action === 'reject') {
                await updateItemStatus(id, 'Rejected');
                setItems(prev => prev.map(item =>
                    item.id === id ? { ...item, status: 'Rejected' } : item
                ));
                showToast('Post has been rejected.', 'error');
            } else if (action === 'delete') {
                await deleteItem(id);
                setItems(prev => prev.filter(item => item.id !== id));
                showToast('Post deleted permanently.', 'info');
            }
        } catch (err) {
            console.error('Update status failed', err);
            showToast('Action failed. Please try again.', 'error');
        }
        closeConfirm();
        setSelectedItem(null); // Close panel after action
    }, [confirm, closeConfirm, showToast]);

    const detailFields = [
        { label: 'Type', key: 'type', render: (val) => <StatusBadge status={val} /> },
        { label: 'Item Name', key: 'item_name' },
        { label: 'Category', key: 'category', render: (val) => val || '—' },
        { label: 'Submitted By', key: 'submittedBy' },
        { label: 'Location', key: 'location' },
        { label: 'Date', key: 'date' },
        { label: 'Contact Info', key: 'contact_info' },
        { label: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
        { 
            label: 'Photo', 
            key: 'image_url', 
            render: (val) => val 
                ? <img src={val} alt="Item" style={{ width: '100%', borderRadius: '8px', marginTop: '8px' }} /> 
                : <span style={{ color: '#94A3B8' }}>No photo available</span>
        },
    ];

    return (
        <main className="dashboard-container">
            <header className="dashboard-header">
                <h1>SmartFinder Admin Dashboard</h1>
                <p>Welcome back, Admin.</p>
            </header>

            <section className="stats-grid">
                <StatCard title="Pending Review" count={stats.pendingReview} variant="warning" />
                <StatCard title="Approved Today" count={stats.approvedToday} />
                <StatCard title="Total Reports" count={stats.totalReports} />
                <StatCard title="Rejected" count={stats.rejected} variant="danger" />
            </section>

            <section className="recent-activity">
                <div className="search-header">
                    <h2>Pending Post Verifications</h2>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search item, location, or student..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Item Name</th>
                                <th>Submitted By</th>
                                <th>Location</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((report) => (
                                <tr key={report.id} className="clickable-row" onClick={() => setSelectedItem(report)}>
                                    <td><StatusBadge status={report.type} /></td>
                                    <td>{report.item_name}</td>
                                    <td>{report.submittedBy}</td>
                                    <td>{report.location}</td>
                                    <td className="date-cell">{report.date}</td>
                                    <td><StatusBadge status={report.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                        <p className="empty-state">No items found.</p>
                    )}
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
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title="Post Details"
                data={selectedItem || {}}
                fields={detailFields}
                actions={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        {selectedItem?.status === 'Pending Review' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-danger" style={{ flex: 1 }} onClick={() => openConfirm(selectedItem.id, 'reject')}>Reject</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={() => openConfirm(selectedItem.id, 'approve')}>Approve</button>
                            </div>
                        )}
                        <button className="btn-danger" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', width: '100%' }} onClick={() => openConfirm(selectedItem.id, 'delete')}>
                            Delete Post Permanently
                        </button>
                    </div>
                }
            />
        </main>
    );
}

export default Dashboard;