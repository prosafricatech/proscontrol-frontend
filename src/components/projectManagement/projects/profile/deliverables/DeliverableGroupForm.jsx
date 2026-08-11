"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextField,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
  Autocomplete,
  Grid,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useSnackbar } from "notistack";
import { useProjectProfile } from "../ProjectProfileProvider";
import projectsServices from "../../project-services";
import { Div } from "@jumbo/shared";
import { sanitizedNumber } from "@/app/helpers/input-sanitization-helpers";

const DeliverableGroupForm = ({ setOpenDialog, deliverableGroup = null, parentGroup = null }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project, deliverable_groups } = useProjectProfile();

  // ✅ mutation: add group
  const addDeliverableGroup = useMutation({
    mutationFn: projectsServices.addDeliverableGroup,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["projectDeliverableGroups"] });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Error occurred", {
        variant: "error",
      });
    },
  });

  // ✅ mutation: update group
  const updateDeliverableGroup = useMutation({
    mutationFn: projectsServices.updateDeliverableGroup,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["projectDeliverableGroups"] });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Error occurred", {
        variant: "error",
      });
    },
  });

  // ✅ pick mutation dynamically
  const saveMutation = deliverableGroup ? updateDeliverableGroup : addDeliverableGroup;

  const toOptions = (groups, depth = 0, parent_id = null) => {
    if (!Array.isArray(groups)) return [];

    return groups.flatMap((group) => {
      const { name, weighted_percentage, children = [], position_index, id } = group;

      const option = {
        name: `After - ${name}`,
        depth,
        id,
        parent_id,
        weighted_percentage,
        position_index,
      };

      const groupChildren = toOptions(children, depth + 1, id);

      return [option, ...groupChildren];
    });
  };

  const deliverableGroups = toOptions(deliverable_groups);

  const sameLevelGroups = deliverableGroups.filter(
    (group) =>
      group.parent_id ===
      (parentGroup ? parentGroup.id : deliverableGroup ? deliverableGroup?.parent_group_id : null)
  );

  const positionIndexOptions = [
    { name: "At the beginning", position_index: null, id: null },
    ...sameLevelGroups,
  ];

  const validationSchema = yup.object({
    name: yup.string().required("Group name is required").typeError("Group name is required"),
    weighted_percentage: yup
      .number()
      .nullable()
      .notRequired()
      .test("greater-than-zero", "Weight Percentage must be greater than 0", function (value) {
        // Allow null/undefined/empty values
        if (value === null || value === undefined || value === '') {
          return true;
        }
        
        // Check if value is a valid number
        if (isNaN(value)) {
          return this.createError({
            message: "Weight Percentage must be a valid number"
          });
        }
        
        // Reject 0 and negative numbers
        if (value <= 0) {
          return this.createError({
            message: "Weight Percentage must be greater than 0"
          });
        }
        
        return true;
      })
      .max(100, "Weight Percentage must be less than or equal to 100")
      .test("check-total", function (value) {
        const context = this.options.context || {};
        const { sameLevelGroups, deliverableGroup } = context;

        if (!sameLevelGroups) return true;

        const totalWeightPercentages = sameLevelGroups.reduce(
          (total, grp) =>
            total + (deliverableGroup && grp.position_index === deliverableGroup.position_index ? 0 : (grp.weighted_percentage || 0)),
          0
        );

        // If value is null/undefined, skip this check
        if (value === null || value === undefined || value === '') {
          return true;
        }

        if (totalWeightPercentages + value > 100) {
          return this.createError({
            message: `Total percentage should not exceed 100%. You currently have ${totalWeightPercentages}% allocated.`,
          });
        }
        return true;
      }),
  });

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      project_id: project.id,
      id: deliverableGroup ? deliverableGroup.id : null,
      name: deliverableGroup?.name || "",
      code: deliverableGroup?.code || "",
      description: deliverableGroup?.description || "",
      weighted_percentage: deliverableGroup?.weighted_percentage || null,
      parent_group_id: parentGroup ? parentGroup.id : deliverableGroup?.parent_group_id,
      position_index: deliverableGroup ? deliverableGroup.position_index : null,
    },
    context: { sameLevelGroups, deliverableGroup },
  });

  const onSubmit = (data) => {
    if (Object.keys(errors).length === 0) {
      saveMutation.mutate(data);
    } else {
      enqueueSnackbar("Please resolve the errors before submitting.", { variant: "error" });
    }
  };

  return (
    <>
      <DialogTitle textAlign="center">
        {deliverableGroup ? `Edit: ${deliverableGroup.name}` : "New Deliverable Groups"}
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  label="Name"
                  fullWidth
                  error={!!errors?.name}
                  helperText={errors?.name?.message}
                  {...register("name")}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField size="small" label="Code" fullWidth {...register("code")} />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  defaultValue={deliverableGroup?.weighted_percentage}
                  error={!!errors?.weighted_percentage}
                  helperText={errors?.weighted_percentage?.message}
                  label="Weighted Percentage"
                  InputProps={{
                    endAdornment: <span>%</span>,
                  }}
                  onChange={(e) => {
                    setValue("weighted_percentage", e.target.value ? sanitizedNumber(e.target.value) : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={
                    deliverableGroup
                      ? positionIndexOptions.filter(
                          (group) => group.position_index !== deliverableGroup?.position_index
                        )
                      : positionIndexOptions
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => <TextField {...params} label="Position" size="small" fullWidth />}
                  onChange={(e, newValue) => {
                    setValue("position_index", newValue && newValue?.position_index + 1, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  {...register("description")}
                />
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          size="small"
          sx={{ display: "flex" }}
          loading={addDeliverableGroup.isPending || updateDeliverableGroup.isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default DeliverableGroupForm;
