import { useState, useEffect, useCallback } from 'react';
import useFormHandler from '../hooks/useFormHandler';
import { fetchProfile, updateProfile, changePassword } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import useConfirmModal from '../hooks/useConfirmModal';
import '../styles/Pages.css';

const CONFIRM_ACTIONS = {
    changePassword: {
        title: 'Change Password',
        message: 'Are you sure you want to change your password? You will need to use the new password for your next login.',
        confirmLabel: 'Update Password',
        variant: 'primary',
    },
    saveProfile: {
        title: 'Save Profile Changes',
        message: 'Are you sure you want to save these changes to your profile details?',
        confirmLabel: 'Save Changes',
        variant: 'primary',
    }
};

function Profile() {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const { confirm, openConfirm, closeConfirm, confirmProps } = useConfirmModal(CONFIRM_ACTIONS);

    const { form, setForm, feedback, handleChange, showFeedback, setFeedback } = useFormHandler({
        full_name: '',
        email: '',
        department: '',
    });

    const [pwdForm, setPwdForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchProfile();
            setProfile(data);
            setForm({
                full_name: data.full_name || '',
                email: data.email || '',
                department: data.department || '',
            });
        } catch (err) {
            showFeedback('Failed to load profile. Please try again.', 0);
        } finally {
            setLoading(false);
        }
    }, [setForm, showFeedback]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleEdit = () => {
        setIsEditing(true);
        setFeedback('');
    };

    const handleCancel = () => {
        setForm({
            full_name: profile.full_name || '',
            email: profile.email || '',
            department: profile.department || '',
        });
        setIsEditing(false);
        setFeedback('');
    };

    const [isProcessing, setIsProcessing] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const handleSaveSubmit = async () => {
        try {
            setIsProcessing(true);
            const updated = await updateProfile(form);
            setProfile(updated);
            setIsEditing(false);
            showFeedback('Profile updated successfully!');
            closeConfirm();
        } catch (err) {
            showFeedback('Failed to update profile.', 0);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePasswordSubmit = async () => {
        try {
            setIsProcessing(true);
            await changePassword(pwdForm);
            setIsChangingPassword(false);
            setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
            showFeedback('Password updated successfully!');
            closeConfirm();
        } catch (err) {
            let msg = 'Failed to update password.';
            try {
                const errObj = JSON.parse(err.message);
                if (errObj.current_password) msg = 'Current password is incorrect.';
                else if (errObj.new_password) msg = errObj.new_password[0];
            } catch(e) {}
            showFeedback(msg, 0);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        if (!form.full_name || !form.email) {
            showFeedback('Name and email are required.', 0);
            return;
        }
        openConfirm(null, 'saveProfile');
    };

    const handlePasswordClick = (e) => {
        e.preventDefault();
        if (pwdForm.new_password !== pwdForm.confirm_password) {
            showFeedback('New passwords do not match.', 0);
            return;
        }
        openConfirm(null, 'changePassword');
    };

    if (loading) return <div className="page-container"><p>Loading profile...</p></div>;

    return (
        <main className="page-container">
            <div className="page-header">
                <h1>{profile?.is_staff ? 'Admin Profile' : 'User Profile'}</h1>
                <p>View and manage your account details.</p>
            </div>

            <section className="form-card profile-card">
                {feedback && <div className={`form-feedback ${feedback.includes('success') ? 'success' : 'error'}`}>{feedback}</div>}
        {!isEditing && !isChangingPassword ? (
            <div className="profile-view">
                <div className="profile-avatar">
                    <span className="avatar-icon">👤</span>
                </div>
                <span className={`profile-role-badge ${profile?.is_staff ? 'admin-badge' : ''}`}>
                    {profile?.is_staff ? 'ADMIN' : (profile?.role || 'STUDENT')}
                </span>

            <div className="profile-details">
                <div className="profile-field">
                                <span className="field-label">Username</span>
                                <span className="field-value">{profile?.username}</span>
                            </div>
                            <div className="profile-field">
                                <span className="field-label">Full Name</span>
                                <span className="field-value">{profile?.full_name || 'Not set'}</span>
                            </div>
                            <div className="profile-field">
                                <span className="field-label">Email Address</span>
                                <span className="field-value">{profile?.email}</span>
                            </div>
                            <div className="profile-field">
                                <span className="field-label">Department</span>
                                <span className="field-value">{profile?.department || 'Not set'}</span>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn-primary" onClick={handleEdit}>Edit Profile</button>
                            <button className="btn-secondary" onClick={() => setIsChangingPassword(true)}>Change Password</button>
                            </div>
                            </div>
                            ) : isEditing ? (

                    <form onSubmit={handleSaveClick} className="page-form">
                        <h2>Edit Profile</h2>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required disabled={isProcessing} />
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={isProcessing} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input type="text" name="department" value={form.department} onChange={handleChange} disabled={isProcessing} />
                        </div>
                        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-primary" disabled={isProcessing}>
                                {isProcessing ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isProcessing}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordClick} className="page-form">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Change Password</h2>
                            <button 
                                type="button" 
                                className="btn-text" 
                                onClick={() => setShowPwd(!showPwd)}
                                style={{ fontSize: '0.85rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {showPwd ? '👁️ Hide Passwords' : '👁️ Show Passwords'}
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input 
                                type={showPwd ? "text" : "password"}
                                value={pwdForm.current_password} 
                                onChange={(e) => setPwdForm({...pwdForm, current_password: e.target.value})} 
                                required 
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input 
                                type={showPwd ? "text" : "password"}
                                value={pwdForm.new_password} 
                                onChange={(e) => setPwdForm({...pwdForm, new_password: e.target.value})} 
                                required 
                                minLength={6}
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="form-group">
                            <label>Retype New Password</label>
                            <input 
                                type={showPwd ? "text" : "password"}
                                value={pwdForm.confirm_password} 
                                onChange={(e) => setPwdForm({...pwdForm, confirm_password: e.target.value})} 
                                required 
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn-primary" disabled={isProcessing}>
                                {isProcessing ? 'Updating...' : 'Update Password'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setIsChangingPassword(false)} disabled={isProcessing}>Cancel</button>
                        </div>
                    </form>
                )}
            </section>

            <ConfirmModal
                isOpen={confirm.open}
                {...confirmProps}
                onConfirm={confirm.action === 'saveProfile' ? handleSaveSubmit : handlePasswordSubmit}
                onCancel={closeConfirm}
            />
        </main>
    );
}

export default Profile;


