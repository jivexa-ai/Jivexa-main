import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, Prescription, OrderItem, Order } from '../../context/HealthDataContext';
import { useCart, CartItem } from '../../context/CartContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { 
  Pill, Calendar, FileText, CheckCircle2, ChevronRight, 
  ShoppingBag, ArrowRight, Search, Eye, ShoppingCart, Trash2, 
  Plus, Minus, MapPin, CheckCircle, Clock, Truck, ShieldAlert, Upload
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  requiresPrescription: boolean;
  description: string;
  sideEffects: string;
  usage: string;
  sku: string;
}

const PRODUCT_CATALOG: Product[] = [
  { 
    id: 'prod_para_500', 
    name: 'Paracetamol 500mg', 
    category: 'Analgesics', 
    price: 15, 
    requiresPrescription: false, 
    description: 'Rapid relief from pain and fever. Gentle on the stomach.', 
    sideEffects: 'Rare: skin rash, liver concerns if overdosed.', 
    usage: '1-2 tablets every 4-6 hours as needed (Max 4g per day).',
    sku: 'sku-para-500'
  },
  { 
    id: 'prod_amox_250', 
    name: 'Amoxicillin 250mg', 
    category: 'Antibiotics', 
    price: 65, 
    requiresPrescription: true, 
    description: 'Broad-spectrum penicillin antibiotic used to treat bacterial infections.', 
    sideEffects: 'Nausea, mild bloating, skin sensitivities.', 
    usage: 'Take exactly as prescribed by your doctor. Complete the full course.',
    sku: 'sku-amox-250'
  },
  { 
    id: 'prod_ceti_10', 
    name: 'Cetirizine 10mg', 
    category: 'Antihistamines', 
    price: 20, 
    requiresPrescription: false, 
    description: 'Non-drowsy 24-hour relief from seasonal allergies, sneezing, and hives.', 
    sideEffects: 'Mild fatigue, dry throat, headaches.', 
    usage: '1 tablet daily with or without food.',
    sku: 'sku-ceti-10'
  },
  { 
    id: 'prod_metf_500', 
    name: 'Metformin 500mg', 
    category: 'Anti-Diabetic', 
    price: 40, 
    requiresPrescription: true, 
    description: 'Oral diabetes medication that helps control blood sugar levels for Type 2 diabetes.', 
    sideEffects: 'Mild stomach discomfort, metallic taste, nausea.', 
    usage: 'Take with meals as directed by your physician.',
    sku: 'sku-metf-500'
  },
  { 
    id: 'prod_ator_10', 
    name: 'Atorvastatin 10mg', 
    category: 'Cardiovascular', 
    price: 80, 
    requiresPrescription: true, 
    description: 'Statin medication used to lower bad cholesterol and prevent cardiovascular risk.', 
    sideEffects: 'Muscle soreness, joint discomfort, fatigue.', 
    usage: 'Take once daily at night. Avoid excessive grapefruit juice.',
    sku: 'sku-ator-10'
  }
];

const CATEGORIES = ['All', 'Analgesics', 'Antibiotics', 'Antihistamines', 'Anti-Diabetic', 'Cardiovascular'];

export const PatientMedicines: React.FC = () => {
  const { user } = useAuth();
  const { prescriptions, pharmacies, placePharmacyOrder, orders } = useHealthData();
  const { 
    cartItems, addToCart, removeFromCart, updateQuantity, 
    clearCart, cartTotal, cartCount, hasPrescriptionRequiredItems 
  } = useCart();
  
  const [activeTab, setActiveTab] = useState<'Store' | 'Prescriptions' | 'ActiveMeds' | 'Orders'>('Store');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('00000000-0000-0000-0000-000000000011');
  const [linkedPrescriptionId, setLinkedPrescriptionId] = useState('none');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const patientPres = prescriptions.filter((p) => p.patientId === user?.id);
  const activeMeds = patientPres.flatMap((p) => p.medications);
  const patientOrders = orders.filter((o) => o.patientId === user?.id);

  const filteredProducts = PRODUCT_CATALOG.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (prod: Product) => {
    addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      category: prod.category,
      requiresPrescription: prod.requiresPrescription,
      sku: prod.sku
    });
    setToastMsg(`"${prod.name}" added to cart!`);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress) {
      setToastMsg('Please enter a delivery address.');
      return;
    }

    if (hasPrescriptionRequiredItems && linkedPrescriptionId === 'none' && !uploadedFile) {
      setToastMsg('Prescription-required items in cart. Please link a prescription.');
      return;
    }

    setIsSubmitting(true);

    const orderItems: OrderItem[] = cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    try {
      const prescriptionRef = linkedPrescriptionId !== 'none' ? linkedPrescriptionId : (uploadedFile ? 'custom_upload' : undefined);
      const res = await placePharmacyOrder(selectedPharmacyId, orderItems, prescriptionRef);
      
      if (res.success) {
        clearCart();
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setActiveTab('Orders');
        setToastMsg('Order submitted successfully! Awaiting pharmacist verification.');
      } else {
        setToastMsg('Failed to submit order.');
      }
    } catch (err) {
      setToastMsg('Checkout pipeline encountered an error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderFromPrescription = (pres: Prescription) => {
    pres.medications.forEach((med) => {
      const match = PRODUCT_CATALOG.find((p) => p.name.toLowerCase().includes(med.name.toLowerCase().split(' ')[0]));
      if (match) {
        addToCart({
          id: match.id,
          name: match.name,
          price: match.price,
          category: match.category,
          requiresPrescription: match.requiresPrescription,
          sku: match.sku
        });
      } else {
        addToCart({
          id: `custom_${med.name}`,
          name: med.name,
          price: 45,
          category: 'Analgesics',
          requiresPrescription: true,
          sku: 'sku-custom'
        });
      }
    });
    setLinkedPrescriptionId(pres.id);
    setIsCartOpen(true);
    setToastMsg('Medications from prescription loaded into cart.');
  };

  const renderTrackingTimeline = (status: Order['status']) => {
    const steps = [
      { key: 'Pending', label: 'Placed', icon: <Clock size={16} /> },
      { key: 'Verification', label: 'Verification', icon: <ShieldAlert size={16} /> },
      { key: 'Confirmed', label: 'Processing', icon: <Pill size={16} /> },
      { key: 'Ready', label: 'Ready', icon: <CheckCircle size={16} /> },
      { key: 'Completed', label: 'Delivered', icon: <Truck size={16} /> }
    ];

    let activeStepIdx = 0;
    if (status === 'Pending') activeStepIdx = 1;
    else if (status === 'Confirmed' || status === 'Processing') activeStepIdx = 2;
    else if (status === 'Ready') activeStepIdx = 3;
    else if (status === 'Completed') activeStepIdx = 4;
    else if (status === 'Cancelled') return <span style={{ color: 'var(--error)', fontWeight: 600 }}>Cancelled</span>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', height: '3px', backgroundColor: 'var(--border)', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '16px', left: '16px', width: `${(activeStepIdx / 4) * 100}%`, height: '3px', backgroundColor: 'var(--primary)', zIndex: 2, transition: 'width 0.4s ease' }} />
          
          {steps.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isActive = idx === activeStepIdx;
            
            return (
              <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 3, width: '60px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted || isActive ? 'var(--primary)' : 'white',
                  color: isCompleted || isActive ? 'white' : 'var(--text-light)',
                  border: isCompleted || isActive ? 'none' : '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive ? '0 0 0 4px var(--primary-light)' : 'none'
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacy & Meds</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>My Medications & Prescriptions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Browse store medicines, view clinical prescriptions, and track order fulfillment.
          </p>
        </div>
        
        <Button onClick={() => setIsCartOpen(true)} variant="primary" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} />
          <span>Cart ({cartCount})</span>
          {cartCount > 0 && (
            <span style={{
              backgroundColor: 'white',
              color: 'var(--primary)',
              borderRadius: '50%',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 6px',
              marginLeft: '4px'
            }}>
              ₹{cartTotal}
            </span>
          )}
        </Button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '24px' }}>
        {['Store', 'Prescriptions', 'ActiveMeds', 'Orders'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            {tab === 'Store' ? 'Medicine Store' :
             tab === 'Prescriptions' ? 'Clinical Prescriptions' :
             tab === 'ActiveMeds' ? 'Ongoing Medications' :
             'Pharmacy Orders'}
          </button>
        ))}
      </div>

      {activeTab === 'Store' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Input
                placeholder="Search medicines by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} style={{ color: 'var(--text-light)' }} />}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'white',
                    color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
              <Pill size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No products found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Try matching a different search query or filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {filteredProducts.map((prod) => {
                const cartItem = cartItems.find((i) => i.id === prod.id);
                return (
                  <Card key={prod.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {prod.category}
                          </span>
                          {prod.requiresPrescription && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={12} />
                              Rx Required
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{prod.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {prod.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>₹{prod.price}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setDetailProduct(prod)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              padding: '8px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)'
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          
                          {cartItem ? (
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                              <button onClick={() => updateQuantity(prod.id, cartItem.quantity - 1)} style={{ border: 'none', background: 'transparent', padding: '6px 10px', cursor: 'pointer', color: 'var(--primary)' }}><Minus size={12} /></button>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px' }}>{cartItem.quantity}</span>
                              <button onClick={() => updateQuantity(prod.id, cartItem.quantity + 1)} style={{ border: 'none', background: 'transparent', padding: '6px 10px', cursor: 'pointer', color: 'var(--primary)' }}><Plus size={12} /></button>
                            </div>
                          ) : (
                            <Button onClick={() => handleAddToCart(prod)} style={{ height: '34px', padding: '6px 14px', fontSize: '0.85rem' }}>Add</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {patientPres.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
              <FileText size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No prescriptions found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Your doctors haven't issued any digital prescriptions yet.
              </p>
            </div>
          ) : (
            patientPres.map((pres) => (
              <Card 
                key={pres.id}
                title={`Prescription from ${pres.doctorName}`}
                subtitle={`Issued: ${pres.date}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
                    {pres.medications.map((med, idx) => (
                      <div key={idx} style={{ fontSize: '0.9rem' }}>
                        💊 <strong>{med.name}</strong> • {med.dosage} ({med.frequency}) • <span style={{ color: 'var(--text-light)' }}>{med.duration}</span>
                        {med.instructions && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>* {med.instructions}</div>}
                      </div>
                    ))}
                  </div>
                  {pres.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Notes: "{pres.notes}"</p>}
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => handleOrderFromPrescription(pres)} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingCart size={16} />
                      Add to Cart & Place Order
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'ActiveMeds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeMeds.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
              <Pill size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No active medications</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                You have no ongoing medical prescription plans currently logged.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
              {activeMeds.map((med, idx) => (
                <Card key={idx} title={med.name}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div>🩺 <strong>Dosage:</strong> {med.dosage}</div>
                    <div>🕒 <strong>Frequency:</strong> {med.frequency}</div>
                    <div>📅 <strong>Duration:</strong> {med.duration}</div>
                    {med.instructions && <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>Instructions: {med.instructions}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {patientOrders.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
              <ShoppingBag size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No orders found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                You haven't placed any pharmacy orders yet.
              </p>
            </div>
          ) : (
            patientOrders.map((order) => (
              <Card 
                key={order.id}
                title={`Order #${order.id}`}
                subtitle={`Placed at: ${order.pharmacyName} on ${order.date}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span>💊 {it.name} <span style={{ color: 'var(--text-light)' }}>x{it.quantity}</span></span>
                        <span>₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Total Amount:</span>
                    <span>₹{order.totalPrice}</span>
                  </div>

                  {order.prescriptionId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary-light)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                      <FileText size={16} />
                      <span>Digital Prescription Attached (ID: {order.prescriptionId})</span>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status Tracking:</span>
                    {renderTrackingTimeline(order.status)}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {detailProduct && (
        <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title="Product Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', textTransform: 'uppercase' }}>
                {detailProduct.category}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{detailProduct.price}</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{detailProduct.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {detailProduct.description}
              </p>
            </div>

            {detailProduct.requiresPrescription && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--error-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 600 }}>
                <ShieldAlert size={18} />
                <span>Notice: A valid doctor prescription is required to purchase this medicine.</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.88rem' }}>
              <div>📋 <strong>Active Usage instructions:</strong> {detailProduct.usage}</div>
              <div style={{ color: 'var(--text-muted)' }}>⚠️ <strong>Common Side Effects:</strong> {detailProduct.sideEffects}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="outline" onClick={() => setDetailProduct(null)}>Close</Button>
              <Button onClick={() => { handleAddToCart(detailProduct); setDetailProduct(null); }}>Add to Cart</Button>
            </div>
          </div>
        </Modal>
      )}

      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setIsCartOpen(false)}>
          
          <div style={{
            width: '420px',
            maxWidth: '100%',
            backgroundColor: 'white',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Health Cart</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-light)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
                  <p style={{ fontWeight: 600 }}>Your cart is empty</p>
                  <span style={{ fontSize: '0.8rem' }}>Add items from the store to continue.</span>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h5 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{item.name}</h5>
                        {item.requiresPrescription && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 4px', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '2px' }}>Rx</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.category}</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>₹{item.price}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '2px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginTop: '6px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ border: 'none', background: 'transparent', padding: '4px 8px', cursor: 'pointer' }}><Minus size={10} /></button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 2px' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ border: 'none', background: 'transparent', padding: '4px 8px', cursor: 'pointer' }}><Plus size={10} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.05rem', fontWeight: 700 }}>
                  <span>Total Cost:</span>
                  <span>₹{cartTotal}</span>
                </div>
                
                {hasPrescriptionRequiredItems && (
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--error-light)', padding: '10px', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--error)' }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                    <span>Cart contains prescription-only items. Prescription selection is required at checkout.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="outline" onClick={() => clearCart()} style={{ flex: 1 }}>Clear</Button>
                  <Button onClick={() => setIsCheckoutOpen(true)} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Checkout
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Order Checkout">
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <Select
              label="Select Fulfilling Pharmacy"
              value={selectedPharmacyId}
              onChange={(val) => setSelectedPharmacyId(val)}
              options={pharmacies.map((p) => ({ value: p.id, label: `${p.name} (${p.rating} ★) - ${p.address}` }))}
            />

            <Input
              label="Delivery / Shipping Address"
              placeholder="Enter street name, building number, city, pincode"
              icon={<MapPin size={16} />}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />

            {hasPrescriptionRequiredItems && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-raised)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} />
                  Prescription Validation Required
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  One or more items in your cart require a valid prescription. Please select an issued digital prescription or upload a copy.
                </p>

                <Select
                  label="Link Digital Prescription from Account"
                  value={linkedPrescriptionId}
                  onChange={(val) => {
                    setLinkedPrescriptionId(val);
                    if (val !== 'none') setUploadedFile(null);
                  }}
                  options={[
                    { value: 'none', label: 'None - Use file upload instead' },
                    ...patientPres.filter((p) => p.status === 'Issued' || p.status === 'Active' || !p.status).map((p) => ({ value: p.id, label: `Issued by ${p.doctorName} on ${p.date}` }))
                  ]}
                />

                <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', marginRight: '8px' }} />
                  OR UPLOAD ATTACHMENT
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', marginLeft: '8px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile('prescription_upload_temp_stub.pdf');
                      setLinkedPrescriptionId('none');
                      setToastMsg('Prescription document uploaded successfully.');
                    }}
                    style={{
                      border: '2px dashed var(--border)',
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Upload size={16} />
                    {uploadedFile ? `Attached: ${uploadedFile}` : 'Upload prescription copy (PDF/JPG)'}
                  </button>
                  {uploadedFile && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      ✓ Document linked successfully.
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 16px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Order Total:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>₹{cartTotal}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting}>Confirm & Place Order</Button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
};
