/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
  (record, search) => {
    const afterSubmit = (scriptContext) => {
      try {
        const currRec = scriptContext.newRecord;
        log.debug('record', currRec);

        const toBePaidAcc = currRec.getValue({
          fieldId: 'custbody_wf_paid_from_bank_account'
        });
        const mainAcc = currRec.getValue({
          fieldId: 'account'
        });
        const mainSub = currRec.getValue({
          fieldId: 'subsidiary'
        });
        const billAmount = currRec.getValue({
          fieldId: 'total'
        });
        const billCurrency = currRec.getValue({
          fieldId: 'currency'
        });
        const icjeCreated = currRec.getValue({
          fieldId: 'custbody_cp_icje_created'
        });
        const department = currRec.getValue({
          fieldId: 'department'
        });
        const exchangeRate = currRec.getValue({
          fieldId: 'exchangerate'
        });
        const tranDate = currRec.getValue({
          fieldId: 'trandate'
        });
        const postingPeriod = currRec.getValue({
          fieldId: 'postingperiod'
        });

        if (toBePaidAcc && !icjeCreated) { // update later
        // if (toBePaidAcc) {
          let toBePaidSub = 0;
          const accountSearchObj = search.create({
            type: 'account',
            filters:
            [
              ['internalid', 'anyof', toBePaidAcc]
            ],
            columns:
            [
              'subsidiary'
            ]
          });
          const searchResultCount = accountSearchObj.runPaged().count;
          log.debug('accountSearchObj result count', searchResultCount);
          accountSearchObj.run().each((result) => {
            toBePaidSub = result.getValue({
              name: 'subsidiary'
            });
            // .run().each has a limit of 4,000 results
            return true;
          });
          const bankAccounts = {
            RECEIVABLE: 2990,
            PAYABLE: 2992
          };
          const subsidiaries = {
            BHI: 1,
            BTI: 3,
            BCM: 8,
            BGI: 25
          };

          // ICJE Creation
          const advJE = record.create({
            type: record.Type.ADV_INTER_COMPANY_JOURNAL_ENTRY,
            isDynamic: true
          });

          // ICJE Body Fields
          advJE.setValue({
            fieldId: 'subsidiary',
            value: mainSub // ask if Main Sub should be added here
          });
          advJE.setValue({
            fieldId: 'memo',
            value: 'ICJE REVERSAL BILL PAYMENT'
          });
          advJE.setValue({
            fieldId: 'approvalstatus',
            value: 2
          });
          advJE.setValue({
            fieldId: 'currency',
            value: billCurrency
          });
          advJE.setValue({
            fieldId: 'trandate',
            value: tranDate
          });
          advJE.setValue({
            fieldId: 'postingperiod',
            value: postingPeriod
          });

          // ICJE Line values
          let lineSet;

          log.debug('main---tobepaid', mainAcc + '---' + toBePaidAcc);
          if (mainAcc && toBePaidAcc) {
            setLineICJE(mainAcc, toBePaidAcc, mainSub, toBePaidSub, bankAccounts.RECEIVABLE, bankAccounts.PAYABLE, billAmount, advJE, department, exchangeRate);
            lineSet = true;
          } else {
            lineSet = false;
          }

          if (lineSet) {
            advJE.setValue({
              fieldId: 'custbody_linked_bill_payment',
              value: currRec.id
            });
            const icjeRecId = advJE.save();
            record.submitFields({
              id: scriptContext.newRecord.id,
              type: scriptContext.newRecord.type,
              values: {
                custbody_cp_icje_created: icjeRecId,
                custbody_cp_icje_status: 'SUCCESS'
              }
            });
          } else {
            record.submitFields({
              id: scriptContext.newRecord.id,
              type: scriptContext.newRecord.type,
              values: { custbody_cp_icje_status: 'FAILED: Bank Account selection invalid' }
            });
          }
        } else if (!toBePaidAcc) {
          record.submitFields({
            id: scriptContext.newRecord.id,
            type: scriptContext.newRecord.type,
            values: { custbody_cp_icje_status: '' }
          });
        }
      } catch (e) {
        log.debug('ERROR', e);
      }
    };

    function setLineICJE(mainAcc, toBePaidAcc, mainSub, toBePaidSub, creditAcc, debitAcc, amount, advJE, dept, exchangeRate) {
      // Debit 1
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linesubsidiary',
        value: parseInt(mainSub)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: parseInt(mainAcc)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'debit',
        value: amount
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'department',
        value: dept
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linefxrate',
        value: exchangeRate
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'ICJE REVERSAL BILL PAYMENT'
      });

      advJE.selectNewLine({
        sublistId: 'line'
      });
      advJE.commitLine({
        sublistId: 'line'
      });
      log.debug('LINE 1', 'LINE 1');
      const repEntity = (search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: mainSub,
        columns: ['representingvendor']
      }).representingvendor);
      log.debug('repEntity', repEntity);
      const rep = repEntity[0].value;
      log.debug('rep', rep);
      const paidEntity = (search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: toBePaidSub,
        columns: ['representingvendor']
      }).representingvendor);
      log.debug('paidEntity', paidEntity);
      const paidRep = paidEntity[0].value;
      log.debug('rep', rep);
      log.debug('paidRep', paidRep);

      // Credit 1
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linesubsidiary',
        value: mainSub
      });
      // debug here
      // 126010 Intercompany Current Receivable
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: creditAcc
      }); // add entity here
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'entity',
        value: paidRep
      }); // check later
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'credit',
        value: amount
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'department',
        value: dept
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linefxrate',
        value: exchangeRate
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'ICJE REVERSAL BILL PAYMENT'
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'eliminate',
        value: true
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'duetofromsubsidiary',
        value: parseInt(toBePaidSub)
      });

      advJE.selectNewLine({
        sublistId: 'line'
      });
      advJE.commitLine({
        sublistId: 'line'
      });
      log.debug('LINE 2', 'LINE 2');

      // Debit 2
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linesubsidiary',
        value: parseInt(toBePaidSub)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: parseInt(debitAcc)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'debit',
        value: amount
      }); // 216010 Intercompany Current Payable
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'entity',
        value: parseInt(rep)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'department',
        value: dept
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linefxrate',
        value: exchangeRate
      });
      // add entity here
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'ICJE REVERSAL BILL PAYMENT'
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'eliminate',
        value: true
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'duetofromsubsidiary',
        value: parseInt(mainSub)
      });

      advJE.selectNewLine({
        sublistId: 'line'
      });
      advJE.commitLine({
        sublistId: 'line'
      });
      log.debug('LINE 3', 'LINE 3');

      // Credit 2
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linesubsidiary',
        value: parseInt(toBePaidSub)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'account',
        value: parseInt(toBePaidAcc)
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'credit',
        value: amount
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'department',
        value: dept
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'linefxrate',
        value: exchangeRate
      });
      advJE.setCurrentSublistValue({
        sublistId: 'line',
        fieldId: 'memo',
        value: 'ICJE REVERSAL BILL PAYMENT'
      });

      advJE.commitLine({
        sublistId: 'line'
      });
      log.debug('LINE 4', 'LINE 4');
    }

    return { afterSubmit };
  });
