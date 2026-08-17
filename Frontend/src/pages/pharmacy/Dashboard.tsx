import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, Order } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { 
  ShoppingBag, Clipboard, Pill, ListOrdered, 
  Settings, CheckCircle, Package, ArrowRight, TrendingUp, FileText, ShieldAlert, CheckCircle2
} from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders, inventory, updateOrderStatus, updateInventoryStock, pharmacies, prescriptions } = useHealthData();
  
  const activePharmacy = pharmacies.find((p) => p.id === user?.id) || pharmacies.find((p) => p.id === '00000000-0000-0000-0000-000000000011') || pharmacies.find((p) => p.id === 'pharm_1') || pharmacies[0];

  const [activeTab, setActiveTab] = useState<'Orders' | 'Inventory'>('Orders');
  const [toastMsg, setToastMsg] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);

  const pharmOrders = orders.filter((o) => o.pharmacyId === activePharmacy?.id);
  const activeOrders = pharmOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
  const pastOrders = pharmOrders.filter((o) => o.status === 'Completed' || o.status === 'Cancelled');
  
  const pharmInventory = inventory.filter((i) => i.pharmacyId === activePharmacy?.id);

  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const handleStatusChange = (orderId: string, nextStatus: Order['status']) => {
    updateOrderStatus(orderId, nextStatus);
    setToastMsg(`Order #${orderId} status updated to: ${nextStatus}`);
  };

  const handleStockUpdate = (itemId: string, currentVal: number) => {
    const editVal = stockEdits[itemId];
    if (editVal === undefined || isNaN(editVal)) return;

    updateInventoryStock(itemId, editVal);
    setToastMsg('Inventory stock level updated successfully.');
    const updated = { ...stockEdits };
    delete updated[itemId];
    setStockEdits(updated);
  };

  const activePrescription = prescriptions.find((p) => p.id === selectedPrescriptionId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fulfillment Portal</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>{activePharmacy?.name || 'Pharmacy Hub'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Address: **{activePharmacy?.address}** • Rating: **{activePharmacy?.rating} ★**
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '24px' }}>
        <button
          onClick={() => setActiveTab('Orders')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Orders' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Orders' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          Active Orders Queue ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('Inventory')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Inventory' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Inventory' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          Inventory & Stock Management
        </button>
      </div>

      {activeTab === 'Orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="grid-2-mobile">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Incoming Orders Queue</h3>
            {activeOrders.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white' }}>
                <Package size={36} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No pending or active medicine orders currently in queue.</p>
              </div>
            ) : (
              activeOrders.map((ord) => (
                <Card 
                  key={ord.id}
                  title={`Order #${ord.id}`}
                  subtitle={`Patient: ${ord.patientName} • Date: ${ord.date}`}
                  headerAction={
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: ord.status === 'Pending' ? 'var(--error-light)' : 'var(--warning-light)', 
                      color: ord.status === 'Pending' ? 'var(--error)' : 'var(--warning)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {ord.status === 'Pending' && <ShieldAlert size={12} />}
                      {ord.status === 'Pending' ? 'Awaiting Rx Review' : ord.status}
                    </span>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ord.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: 'var(--text-light)' }}>Qty: {item.quantity} • ₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {ord.prescriptionId && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'var(--surface-raised)',
                        padding: '10px 14px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Linked Doctor Prescription:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPrescriptionId(ord.prescriptionId || null)}
                          style={{
                            backgroundColor: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--primary)'
                          }}
                        >
                          Verify Prescription
                        </button>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex-col-mobile gap-sm">
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Total Order Price: ₹{ord.totalPrice}</span>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {ord.status === 'Pending' && (
                          <>
                            <Button variant="danger" onClick={() => handleStatusChange(ord.id, 'Cancelled')} style={{ height: '34px', fontSize: '0.78rem' }}>Reject</Button>
                            <Button 
                              onClick={() => handleStatusChange(ord.id, 'Confirmed')} 
                              disabled={!!ord.prescriptionId && selectedPrescriptionId !== ord.prescriptionId}
                              style={{ height: '34px', fontSize: '0.78rem' }}
                            >
                              Verify & Confirm
                            </Button>
                          </>
                        )}
                        {ord.status === 'Confirmed' && (
                          <Button onClick={() => handleStatusChange(ord.id, 'Processing')} style={{ height: '34px', fontSize: '0.78rem' }}>Process Order</Button>
                        )}
                        {ord.status === 'Processing' && (
                          <Button onClick={() => handleStatusChange(ord.id, 'Ready')} style={{ height: '34px', fontSize: '0.78rem' }}>Mark as Ready</Button>
                        )}
                        {ord.status === 'Ready' && (
                          <Button onClick={() => handleStatusChange(ord.id, 'Completed')} style={{ height: '34px', fontSize: '0.78rem' }}>Mark Completed</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Archived Orders</h3>
            <Card>
              {pastOrders.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
                  No completed logs yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pastOrders.slice(0, 5).map((ord) => (
                    <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-raised)', paddingBottom: '8px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block' }}>Order #{ord.id}</span>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{ord.patientName} • Total: ₹{ord.totalPrice}</span>
                      </div>
                      <span style={{
                        fontWeight: 600,
                        color: ord.status === 'Completed' ? 'var(--secondary)' : 'var(--error)',
                        fontSize: '0.75rem'
                      }}>
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="card" style={{ padding: 0, backgroundColor: 'white', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Medicine Brand Name</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Category</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Stock Level</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Standard Price (₹)</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pharmInventory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--primary)' }}>{item.name}</td>
                  <td style={{ padding: '14px 20px' }}>{item.category}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {stockEdits[item.id] !== undefined ? (
                      <input 
                        type="number"
                        value={stockEdits[item.id]}
                        onChange={(e) => setStockEdits({ ...stockEdits, [item.id]: Number(e.target.value) })}
                        style={{ width: '80px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    ) : (
                      <span style={{ 
                        fontWeight: 700, 
                        color: item.stock < 100 ? 'var(--error)' : 'var(--secondary)'
                      }}>
                        {item.stock} Units
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>₹{item.price}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {stockEdits[item.id] !== undefined ? (
                      <Button onClick={() => handleStockUpdate(item.id, item.stock)} style={{ height: '28px', padding: '4px 10px', fontSize: '0.75rem' }}>
                        Save
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setStockEdits({ ...stockEdits, [item.id]: item.stock })} style={{ height: '28px', padding: '4px 10px', fontSize: '0.75rem' }}>
                        Edit Stock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}

      {selectedPrescriptionId && (
        <Modal 
          isOpen={!!selectedPrescriptionId} 
          onClose={() => setSelectedPrescriptionId(null)} 
          title="Clinical Prescription Verification"
        >
          {selectedPrescriptionId === 'custom_upload' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={24} />
              </div>
              <h4 style={{ fontWeight: 700 }}>Custom Patient Prescription Copy Attached</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                The patient uploaded a custom file copy (*prescription_upload_temp_stub.pdf*) at checkout for verification.
              </p>
              <div style={{ border: '1px dashed var(--border)', padding: '12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                📄 prescription_upload_temp_stub.pdf
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button onClick={() => setSelectedPrescriptionId(null)}>Close</Button>
              </div>
            </div>
          ) : activePrescription ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Verified JIVEXA Digital Document</span>
                <h4 style={{ fontWeight: 700, marginTop: '4px' }}>Issued by {activePrescription.doctorName}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Date: {activePrescription.date} • Patient: {activePrescription.patientName}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
                {activePrescription.medications.map((med, idx) => (
                  <div key={idx} style={{ fontSize: '0.88rem' }}>
                    💊 <strong>{med.name}</strong> • {med.dosage} ({med.frequency}) • {med.duration}
                    {med.instructions && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>* {med.instructions}</div>}
                  </div>
                ))}
              </div>

              {activePrescription.notes && (
                <div style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-raised)', padding: '8px 12px', borderRadius: '4px' }}>
                  Doctor Notes: "{activePrescription.notes}"
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button onClick={() => setSelectedPrescriptionId(null)}>Close & Return</Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No prescription record matches this ID.
            </div>
          )}
        </Modal>
      )}

    </div>
  );
};

export const PharmacySettings: React.FC = () => {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Card title="Pharmacy Setup">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          To edit delivery parameters, bank details, or verify registration certificates, please contact platform administrators at **support@jivexa.in**.
        </p>
      </Card>
    </div>
  );
};
