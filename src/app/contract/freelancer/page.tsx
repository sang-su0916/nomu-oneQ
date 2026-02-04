'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, EmployeeInfo } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, formatCurrency, formatBusinessNumber, formatPhoneNumber } from '@/lib/storage';

interface FreelancerContractData {
  company: CompanyInfo;
  contractor: EmployeeInfo;
  contractDate: string;
  startDate: string;
  endDate: string;
  projectName: string;
  projectDescription: string;
  deliverables: string;
  totalFee: number;
  paymentSchedule: {
    description: string;
    amount: number;
    dueDate: string;
  }[];
  taxWithholding: number;
}

const defaultContractor: EmployeeInfo = {
  name: '',
  residentNumber: '',
  address: '',
  phone: '',
};

const defaultContract: FreelancerContractData = {
  company: defaultCompanyInfo,
  contractor: defaultContractor,
  contractDate: new Date().toISOString().split('T')[0],
  startDate: '',
  endDate: '',
  projectName: '',
  projectDescription: '',
  deliverables: '',
  totalFee: 0,
  paymentSchedule: [
    { description: '계약금', amount: 0, dueDate: '' },
    { description: '잔금', amount: 0, dueDate: '' },
  ],
  taxWithholding: 3.3,
};

export default function FreelancerContractPage() {
  const [contract, setContract] = useState<FreelancerContractData>(defaultContract);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompany = loadCompanyInfo();
    if (savedCompany) {
      setContract(prev => ({ ...prev, company: savedCompany }));
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `프리랜서_계약서_${contract.contractor.name || '이름없음'}`,
  });

  const updateContract = (field: string, value: unknown) => {
    setContract(prev => ({ ...prev, [field]: value }));
  };

  const updateContractor = (field: keyof EmployeeInfo, value: string) => {
    setContract(prev => ({
      ...prev,
      contractor: { ...prev.contractor, [field]: value }
    }));
  };

  const updatePaymentSchedule = (index: number, field: string, value: string | number) => {
    setContract(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addPaymentSchedule = () => {
    setContract(prev => ({
      ...prev,
      paymentSchedule: [...prev.paymentSchedule, { description: '', amount: 0, dueDate: '' }]
    }));
  };

  const removePaymentSchedule = (index: number) => {
    setContract(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.filter((_, i) => i !== index)
    }));
  };

  // 원천징수 금액 계산
  const withholdingAmount = Math.round(contract.totalFee * (contract.taxWithholding / 100));
  const netAmount = contract.totalFee - withholdingAmount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💼 프리랜서 계약서</h1>
          <p className="text-gray-500 mt-1">용역/도급 계약서를 작성합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
          >
            {showPreview ? '✏️ 수정하기' : '👁️ 미리보기'}
          </button>
          <button onClick={() => handlePrint()} className="btn-primary">
            🖨️ 인쇄/PDF
          </button>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* 갑 (발주자) 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">🏢 갑 (발주자) 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">상호</label>
                <input type="text" className="input-field bg-gray-50" value={contract.company.name} readOnly />
              </div>
              <div>
                <label className="input-label">대표자</label>
                <input type="text" className="input-field bg-gray-50" value={contract.company.ceoName} readOnly />
              </div>
              <div>
                <label className="input-label">사업자등록번호</label>
                <input type="text" className="input-field bg-gray-50" value={formatBusinessNumber(contract.company.businessNumber)} readOnly />
              </div>
              <div>
                <label className="input-label">전화번호</label>
                <input type="text" className="input-field bg-gray-50" value={formatPhoneNumber(contract.company.phone)} readOnly />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">주소</label>
                <input type="text" className="input-field bg-gray-50" value={contract.company.address} readOnly />
              </div>
            </div>
          </div>

          {/* 을 (수급인) 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">👤 을 (수급인/프리랜서) 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">성명 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="홍길동"
                  value={contract.contractor.name}
                  onChange={(e) => updateContractor('name', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">주민등록번호 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="990101-1234567"
                  value={contract.contractor.residentNumber}
                  onChange={(e) => updateContractor('residentNumber', e.target.value.replace(/[^0-9-]/g, '').slice(0, 14))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">주소 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="서울시 강남구 테헤란로 123"
                  value={contract.contractor.address}
                  onChange={(e) => updateContractor('address', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">연락처 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="010-1234-5678"
                  value={contract.contractor.phone}
                  onChange={(e) => updateContractor('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 프로젝트 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">📋 프로젝트 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">계약 체결일 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contract.contractDate}
                  onChange={(e) => updateContract('contractDate', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">계약 시작일 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contract.startDate}
                  onChange={(e) => updateContract('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">계약 종료일 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contract.endDate}
                  onChange={(e) => updateContract('endDate', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <label className="input-label">프로젝트명 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 홈페이지 리뉴얼 프로젝트"
                  value={contract.projectName}
                  onChange={(e) => updateContract('projectName', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <label className="input-label">업무 내용 *</label>
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="수행할 업무 내용을 상세히 기재하세요"
                  value={contract.projectDescription}
                  onChange={(e) => updateContract('projectDescription', e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <label className="input-label">납품물 *</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="예: 디자인 시안 3종, 퍼블리싱 완료 파일, 소스코드 일체"
                  value={contract.deliverables}
                  onChange={(e) => updateContract('deliverables', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 계약 금액 */}
          <div className="form-section">
            <h2 className="form-section-title">💰 계약 금액</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">총 계약금액 (원) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="5000000"
                  value={contract.totalFee || ''}
                  onChange={(e) => updateContract('totalFee', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-400 mt-1">
                  {contract.totalFee > 0 && `= ${formatCurrency(contract.totalFee)}`}
                </p>
              </div>
              <div>
                <label className="input-label">원천징수율 (%)</label>
                <select
                  className="input-field"
                  value={contract.taxWithholding}
                  onChange={(e) => updateContract('taxWithholding', parseFloat(e.target.value))}
                >
                  <option value={3.3}>3.3% (사업소득)</option>
                  <option value={8.8}>8.8% (기타소득)</option>
                  <option value={0}>0% (원천징수 없음)</option>
                </select>
              </div>
            </div>

            {/* 지급 일정 */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="input-label">지급 일정</label>
                <button
                  type="button"
                  onClick={addPaymentSchedule}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + 일정 추가
                </button>
              </div>
              <div className="space-y-3">
                {contract.paymentSchedule.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="항목 (예: 계약금)"
                      value={schedule.description}
                      onChange={(e) => updatePaymentSchedule(index, 'description', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field w-36"
                      placeholder="금액"
                      value={schedule.amount || ''}
                      onChange={(e) => updatePaymentSchedule(index, 'amount', parseInt(e.target.value) || 0)}
                    />
                    <input
                      type="date"
                      className="input-field w-40"
                      value={schedule.dueDate}
                      onChange={(e) => updatePaymentSchedule(index, 'dueDate', e.target.value)}
                    />
                    {contract.paymentSchedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentSchedule(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 정산 금액 */}
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-medium text-emerald-800 mb-2">📊 정산 예상</h4>
              <div className="text-sm text-emerald-700 space-y-1">
                <p>총 계약금액: {formatCurrency(contract.totalFee)}</p>
                <p>원천징수액 ({contract.taxWithholding}%): -{formatCurrency(withholdingAmount)}</p>
                <p className="font-bold text-lg pt-2 border-t border-emerald-200">
                  실수령액: {formatCurrency(netAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <FreelancerContractPreview contract={contract} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}>
          <FreelancerContractPreview contract={contract} />
        </div>
      </div>
    </div>
  );
}

function FreelancerContractPreview({ contract }: { contract: FreelancerContractData }) {
  const withholdingAmount = Math.round(contract.totalFee * (contract.taxWithholding / 100));

  return (
    <div className="contract-document p-8" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>
        용역(도급) 계약서
      </h1>

      <p style={{ marginBottom: '24px', lineHeight: '1.8' }}>
        <strong>{contract.company.name}</strong>(이하 &quot;갑&quot;이라 함)과(와) 
        <strong> {contract.contractor.name}</strong>(이하 &quot;을&quot;이라 함)은(는) 
        아래와 같이 용역계약을 체결한다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제1조 (목적)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        본 계약은 갑이 을에게 아래 업무를 위탁하고, 을은 이를 수행함에 있어 필요한 사항을 정함을 목적으로 한다.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          <tr>
            <th style={{ border: '1px solid #333', padding: '12px', backgroundColor: '#f3f4f6', width: '25%', textAlign: 'left' }}>
              프로젝트명
            </th>
            <td style={{ border: '1px solid #333', padding: '12px' }}>
              {contract.projectName}
            </td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #333', padding: '12px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              업무내용
            </th>
            <td style={{ border: '1px solid #333', padding: '12px', whiteSpace: 'pre-wrap' }}>
              {contract.projectDescription}
            </td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #333', padding: '12px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              납품물
            </th>
            <td style={{ border: '1px solid #333', padding: '12px', whiteSpace: 'pre-wrap' }}>
              {contract.deliverables}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제2조 (계약기간)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        계약기간은 {formatDate(contract.startDate)}부터 {formatDate(contract.endDate)}까지로 한다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제3조 (계약금액 및 지급)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '8px' }}>
        ① 총 계약금액: 금 {formatCurrency(contract.totalFee)} (부가세 별도)
      </p>
      <p style={{ lineHeight: '1.8', marginBottom: '8px' }}>
        ② 원천징수: {contract.taxWithholding}% ({formatCurrency(withholdingAmount)})
      </p>
      <p style={{ lineHeight: '1.8', marginBottom: '8px' }}>
        ③ 지급일정:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', marginLeft: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>구분</th>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>금액</th>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>지급일</th>
          </tr>
        </thead>
        <tbody>
          {contract.paymentSchedule.map((schedule, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>{schedule.description}</td>
              <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(schedule.amount)}</td>
              <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>{formatDate(schedule.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제4조 (을의 의무)
      </h2>
      <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '16px' }}>
        <li>을은 본 계약에 따른 업무를 성실히 수행하여야 한다.</li>
        <li>을은 업무 수행 중 알게 된 갑의 영업비밀을 제3자에게 누설하여서는 아니 된다.</li>
        <li>을은 갑의 사전 서면 동의 없이 업무의 전부 또는 일부를 제3자에게 위탁하여서는 아니 된다.</li>
      </ul>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제5조 (갑의 의무)
      </h2>
      <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '16px' }}>
        <li>갑은 을의 업무 수행에 필요한 자료 및 정보를 제공하여야 한다.</li>
        <li>갑은 제3조에 따른 용역대금을 지급일에 지급하여야 한다.</li>
      </ul>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제6조 (지식재산권)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        본 계약에 따라 을이 수행한 업무의 결과물에 대한 지식재산권은 용역대금 완납 시 갑에게 귀속된다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제7조 (계약의 해지)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        갑 또는 을은 상대방이 본 계약을 위반한 경우 14일 이상의 기간을 정하여 시정을 요구하고, 
        그 기간 내에 시정되지 않는 경우 본 계약을 해지할 수 있다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제8조 (계약의 성격)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        ① 본 계약은 민법상 도급계약으로서, 을은 독립된 사업자로서 자신의 책임 하에 업무를 수행한다.<br />
        ② 을은 갑의 지휘·감독을 받지 아니하며, 업무 수행의 시간·장소·방법을 자유롭게 결정한다.<br />
        ③ 갑과 을 사이에는 근로기준법상 근로관계가 성립하지 아니한다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제9조 (손해배상)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        갑 또는 을이 본 계약을 위반하여 상대방에게 손해를 입힌 경우, 그 손해를 배상할 책임이 있다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제10조 (분쟁해결)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        본 계약과 관련하여 분쟁이 발생한 경우, 갑의 주소지를 관할하는 법원을 제1심 관할법원으로 한다.
      </p>

      <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
        제11조 (기타)
      </h2>
      <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
        본 계약에 명시되지 않은 사항은 관계 법령 및 상관례에 따르며, 
        본 계약서는 2부를 작성하여 갑과 을이 각각 1부씩 보관한다.
      </p>

      <p style={{ textAlign: 'center', marginTop: '48px', marginBottom: '48px', fontSize: '14px' }}>
        {formatDate(contract.contractDate)}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px' }}>
        <div style={{ width: '45%' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>[갑]</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', width: '80px' }}>상 호:</td>
                <td style={{ padding: '4px 0' }}>{contract.company.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>사업자번호:</td>
                <td style={{ padding: '4px 0' }}>{formatBusinessNumber(contract.company.businessNumber)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>주 소:</td>
                <td style={{ padding: '4px 0' }}>{contract.company.address}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>대표자:</td>
                <td style={{ padding: '4px 0' }}>{contract.company.ceoName} (인)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ width: '45%' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>[을]</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', width: '80px' }}>성 명:</td>
                <td style={{ padding: '4px 0' }}>{contract.contractor.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>주민번호:</td>
                <td style={{ padding: '4px 0' }}>{contract.contractor.residentNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>주 소:</td>
                <td style={{ padding: '4px 0' }}>{contract.contractor.address}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0' }}>연락처:</td>
                <td style={{ padding: '4px 0' }}>{contract.contractor.phone} (인)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
